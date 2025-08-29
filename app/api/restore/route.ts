import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

function makePlaceholderSvg(text: string, w = 800, h = 600, bg = '#f3f4f6', fg = '#111827') {
  const safeText = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>\n  <rect width='100%' height='100%' fill='${bg}'/>\n  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='32' fill='${fg}'>${safeText}</text>\n</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const source = body?.source || 'file';
    let data: any;

    if (source === 'inline' && body?.payload) {
      data = body.payload;
    } else {
      const filePath = path.join(process.cwd(), 'real-data-export-2025-08-24.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(raw);
    }

    const report: Record<string, number> = { categories: 0, products: 0, productImages: 0, categoryImages: 0, orders: 0 };

    // Restore categories
    if (Array.isArray(data.categories)) {
      for (const c of data.categories) {
        await db.category.upsert({
          where: { slug: String(c.slug) },
          update: { name: c.name, imageUrl: c.imageUrl || null, parentId: c.parentId || null },
          create: { name: c.name, slug: c.slug, imageUrl: c.imageUrl || null, parentId: c.parentId || null },
        });
        report.categories++;
      }
    }

    // Restore products (basic fields + link to category)
    if (Array.isArray(data.products)) {
      for (const p of data.products) {
        const created = await db.product.upsert({
          where: { slug: String(p.slug) },
          update: {
            name: p.name,
            description: p.description || null,
            regularPrice: Number(p.regularPrice || 0),
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            buyPrice: Number(p.buyPrice || p.regularPrice || 0),
            currency: p.currency || 'BDT',
            sku: p.sku || null,
            status: p.status || 'PUBLISHED',
            categoryId: Number(p.categoryId),
          },
          create: {
            name: p.name,
            slug: p.slug,
            description: p.description || null,
            regularPrice: Number(p.regularPrice || 0),
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            buyPrice: Number(p.buyPrice || p.regularPrice || 0),
            currency: p.currency || 'BDT',
            sku: p.sku || null,
            status: p.status || 'PUBLISHED',
            categoryId: Number(p.categoryId),
          },
        });

        // Ensure inventory exists
        await db.inventory.upsert({
          where: { productId: created.id },
          update: {},
          create: { productId: created.id, quantity: 10, lowStockThreshold: 2 },
        });

        // Images
        if (Array.isArray(p.images) && p.images.length > 0) {
          for (let i = 0; i < p.images.length; i++) {
            const url = p.images[i];
            await db.productImage.upsert({
              where: { id: 0 }, // force create (no natural key available)
              update: {},
              create: { url: url, alt: p.name, order: i, productId: created.id },
            }).catch(() => db.productImage.create({ data: { url: url, alt: p.name, order: i, productId: created.id } }));
            report.productImages++;
          }
        } else if (body?.withPlaceholders) {
          const url = makePlaceholderSvg(p.name || 'Product');
          await db.productImage.create({ data: { url, alt: p.name || 'Product', order: 0, productId: created.id } });
          report.productImages++;
        }

        report.products++;
      }
    }

    // If placeholders requested, ensure category imageUrl exists
    if (body?.withPlaceholders && Array.isArray(data.categories)) {
      for (const c of data.categories) {
        const existing = await db.category.findUnique({ where: { slug: String(c.slug) } });
        if (existing && !existing.imageUrl) {
          await db.category.update({ where: { id: existing.id }, data: { imageUrl: makePlaceholderSvg(c.name || 'Category', 1200, 400) } });
          report.categoryImages++;
        }
      }
    }

    // Optional: auto-assign real files from public/uploads to categories/products
    if (body?.withAutoAssign) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(uploadsDir)) {
        const allFiles = fs.readdirSync(uploadsDir)
          .filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f))
          .map(f => `/uploads/${f}`);

        let fileIdx = 0;

        // Assign category images where missing or placeholder
        const categories = await db.category.findMany();
        for (const cat of categories) {
          const needsImage = !cat.imageUrl || (typeof cat.imageUrl === 'string' && cat.imageUrl.startsWith('data:image'));
          if (needsImage && allFiles[fileIdx]) {
            await db.category.update({ where: { id: cat.id }, data: { imageUrl: allFiles[fileIdx] } });
            report.categoryImages++;
            fileIdx = (fileIdx + 1) % allFiles.length;
          }
        }

        // Assign product images where none or placeholder
        const products = await db.product.findMany({ include: { images: true } });
        for (const prod of products) {
          const hasReal = prod.images.some(img => img.url && !img.url.startsWith('data:image'));
          if (!hasReal) {
            // Clear placeholder images to avoid duplicates
            if (prod.images.length > 0) {
              for (const img of prod.images) {
                if (img.url.startsWith('data:image')) {
                  await db.productImage.delete({ where: { id: img.id } });
                }
              }
            }
            // Add up to 3 images per product
            for (let k = 0; k < 3 && allFiles[fileIdx]; k++) {
              await db.productImage.create({ data: { url: allFiles[fileIdx], alt: prod.name, order: k, productId: prod.id } });
              report.productImages++;
              fileIdx = (fileIdx + 1) % allFiles.length;
            }
          }
        }
      }
    }

    // Optional: create sample orders if requested and none present
    if (body?.withOrders) {
      const currentOrders = await db.order.count();
      if (currentOrders === 0) {
        const products = await db.product.findMany({ orderBy: { id: 'asc' }, take: 2 });
        if (products.length > 0) {
          const ordersToCreate = [
            {
              orderNo: 'ORD-1001', customerName: 'Ahmed Khan', userEmail: 'ahmed@example.com', phone: '01700000001', address: 'Dhaka, Bangladesh', subtotal: 1500, total: 1500, currency: 'BDT', status: 'pending', paymentStatus: 'UNPAID',
              items: [{ productId: products[0].id, quantity: 1, price: 1500 }]
            },
            {
              orderNo: 'ORD-1002', customerName: 'Fatima Rahman', userEmail: 'fatima@example.com', phone: '01800000002', address: 'Chattogram, Bangladesh', subtotal: 2000, total: 2000, currency: 'BDT', status: 'completed', paymentStatus: 'PAID',
              items: [{ productId: (products[1] || products[0]).id, quantity: 1, price: 2000 }]
            }
          ];

          for (const o of ordersToCreate) {
            const order = await db.order.upsert({ where: { orderNo: o.orderNo }, update: {}, create: {
              orderNo: o.orderNo,
              customerName: o.customerName,
              userEmail: o.userEmail,
              phone: o.phone,
              address: o.address,
              subtotal: o.subtotal,
              total: o.total,
              currency: o.currency,
              status: o.status,
              paymentStatus: o.paymentStatus,
            }});
            for (const it of o.items) {
              await db.orderItem.create({ data: { orderId: order.id, productId: it.productId, quantity: it.quantity, price: it.price } });
            }
            report.orders++;
          }
        }
      }
    }

    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    console.error('Restore failed:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to restore' }, { status: 500 });
  }
}


