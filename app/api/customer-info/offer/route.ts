import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET supports filters: scope (website|landing_page|both), productId, landingPageId
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') || undefined;
    const productId = url.searchParams.get('productId');
    const landingPageId = url.searchParams.get('landingPageId');
    const where: any = {};
    if (scope) where.scope = scope;
    if (productId) where.productId = Number(productId);
    if (landingPageId) where.landingPageId = Number(landingPageId);
    // Try via Prisma Client model first
    // @ts-ignore
    if (db.checkoutOfferSetting?.findMany) {
      // @ts-ignore
      const list = await db.checkoutOfferSetting.findMany({ where, orderBy: { updatedAt: 'desc' }, take: 50 });
      return NextResponse.json(list);
    }
    // Fallback via raw SQL
    const sql: string[] = ['SELECT id, scope, enabled, delaySeconds, title, message, ctaText, imageUrl, productId, landingPageId FROM CheckoutOfferSetting WHERE 1=1'];
    if (where.scope) sql.push(`AND scope = '${where.scope}'`);
    if (where.productId) sql.push(`AND productId = ${Number(where.productId)}`);
    if (where.landingPageId) sql.push(`AND landingPageId = ${Number(where.landingPageId)}`);
    sql.push('ORDER BY updatedAt DESC LIMIT 50');
    const rows: any[] = await db.$queryRawUnsafe(sql.join(' '));
    return NextResponse.json(rows);
  } catch (e) {
    console.error('Offer GET error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id as number | undefined;
    const payload = {
      scope: body.scope || 'website',
      enabled: !!body.enabled,
      delaySeconds: Math.max(0, Math.min(3600, Number(body.delaySeconds ?? 10))),
      title: body.title ?? null,
      message: body.message ?? null,
      ctaText: body.ctaText ?? null,
      imageUrl: body.imageUrl ?? null,
      productId: body.productId ? Number(body.productId) : null,
      landingPageId: body.landingPageId ? Number(body.landingPageId) : null
    };
    // Try via Prisma Client model
    // @ts-ignore
    if (db.checkoutOfferSetting?.create) {
      // @ts-ignore
      const saved = id
        // @ts-ignore
        ? await db.checkoutOfferSetting.update({ where: { id }, data: payload })
        // @ts-ignore
        : await db.checkoutOfferSetting.create({ data: payload });
      return NextResponse.json(saved);
    }
    // Fallback raw SQL UPSERT
    if (id) {
      await db.$executeRawUnsafe(`UPDATE CheckoutOfferSetting SET scope='${payload.scope}', enabled=${payload.enabled ? 1 : 0}, delaySeconds=${payload.delaySeconds}, title=${payload.title ? `'${payload.title.replace(/'/g, "''")}'` : 'NULL'}, message=${payload.message ? `'${payload.message.replace(/'/g, "''")}'` : 'NULL'}, ctaText=${payload.ctaText ? `'${payload.ctaText.replace(/'/g, "''")}'` : 'NULL'}, imageUrl=${payload.imageUrl ? `'${payload.imageUrl.replace(/'/g, "''")}'` : 'NULL'}, productId=${payload.productId ?? 'NULL'}, landingPageId=${payload.landingPageId ?? 'NULL'}, updatedAt=CURRENT_TIMESTAMP WHERE id=${id}`);
      return NextResponse.json({ id, ...payload });
    } else {
      await db.$executeRawUnsafe(`INSERT INTO CheckoutOfferSetting (scope, enabled, delaySeconds, title, message, ctaText, imageUrl, productId, landingPageId, createdAt, updatedAt) VALUES ('${payload.scope}', ${payload.enabled ? 1 : 0}, ${payload.delaySeconds}, ${payload.title ? `'${payload.title.replace(/'/g, "''")}'` : 'NULL'}, ${payload.message ? `'${payload.message.replace(/'/g, "''")}'` : 'NULL'}, ${payload.ctaText ? `'${payload.ctaText.replace(/'/g, "''")}'` : 'NULL'}, ${payload.imageUrl ? `'${payload.imageUrl.replace(/'/g, "''")}'` : 'NULL'}, ${payload.productId ?? 'NULL'}, ${payload.landingPageId ?? 'NULL'}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`);
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    console.error('Offer PUT error', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}


