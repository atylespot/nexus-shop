import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const entries = await db.adProductEntry.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching ad product entries:', error);
    return NextResponse.json({ error: 'Failed to fetch ad product entries' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      month,
      year,
      productId,
      productName,
      productImage,
      buyingPrice,
      sellingPrice,
      fbAdCost,
      deliveryCost,
      returnParcelQty,
      returnCost,
      damagedProductQty,
      damagedCost,
      monthlyBudget,
      desiredProfitPct,
      requiredMonthlyUnits,
      requiredDailyUnits,
    } = body;

    if (!month || !productName) {
      return NextResponse.json({ error: 'month and productName are required' }, { status: 400 });
    }

    const created = await db.adProductEntry.create({
      data: {
        month,
        year: year ? Number(year) : new Date().getFullYear(),
        productId: productId ? Number(productId) : null,
        productName,
        productImage: productImage || null,
        buyingPrice: Number(buyingPrice) || 0,
        sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : null,
        fbAdCost: Number(fbAdCost) || 0,
        deliveryCost: Number(deliveryCost) || 0,
        returnParcelQty: Number.isFinite(Number(returnParcelQty)) ? parseInt(String(returnParcelQty), 10) : 0,
        returnCost: Number(returnCost) || 0,
        damagedProductQty: Number.isFinite(Number(damagedProductQty)) ? parseInt(String(damagedProductQty), 10) : 0,
        damagedCost: Number(damagedCost) || 0,
        monthlyBudget: Number(monthlyBudget) || 0,
        desiredProfitPct: desiredProfitPct !== undefined ? Number(desiredProfitPct) : null,
        requiredMonthlyUnits: requiredMonthlyUnits !== undefined ? parseInt(String(requiredMonthlyUnits), 10) : null,
        requiredDailyUnits: requiredDailyUnits !== undefined ? parseInt(String(requiredDailyUnits), 10) : null,
      }
    });

    // Automatically initialize daily selling targets for the new product
    if (requiredDailyUnits && requiredDailyUnits > 0) {
      try {
        const targetYear = year ? Number(year) : new Date().getFullYear();
        const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month);
        const daysInMonth = new Date(targetYear, monthIndex + 1, 0).getDate();
        
        // Create daily targets in parallel for better performance
        const dailyTargetPromises = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          dailyTargetPromises.push(
            db.sellingTargetEntry.upsert({
              where: {
                adProductEntryId_date: {
                  adProductEntryId: created.id,
                  date: date
                }
              },
              update: {
                targetUnits: requiredDailyUnits
              },
              create: {
                adProductEntryId: created.id,
                date: date,
                targetUnits: requiredDailyUnits,
                soldUnits: 0
              }
            })
          );
        }
        
        // Execute all in parallel
        await Promise.all(dailyTargetPromises);
        console.log(`✅ Automatically initialized ${daysInMonth} daily targets for new product ${created.id}`);
      } catch (error) {
        console.error('⚠️ Failed to initialize daily targets:', error);
        // Don't fail the main operation if target initialization fails
      }
    }

    // Recalculate per-product monthly budget share for this month/year
    // Note: We don't update monthlyBudget here to avoid overwriting other fields
    // The frontend will handle monthly budget updates separately
    try {
      const yearForCalc = (year && Number(year)) || new Date().getFullYear();
      console.log(`📊 POST: Recalculated budget shares for ${month} ${yearForCalc} (no automatic update to preserve fields)`);
    } catch (e) {
      console.error('Recalc share failed', e);
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error('Error creating ad product entry:', error);
    return NextResponse.json({ error: 'Failed to create ad product entry' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    const updated = await db.adProductEntry.update({
      where: { id: Number(id) },
      data: {
        ...('month' in rest ? { month: rest.month } : {}),
        ...('productId' in rest ? { productId: rest.productId ? Number(rest.productId) : null } : {}),
        ...('productName' in rest ? { productName: rest.productName } : {}),
        ...('productImage' in rest ? { productImage: rest.productImage || null } : {}),
        ...('buyingPrice' in rest ? { buyingPrice: Number(rest.buyingPrice) || 0 } : {}),
        ...('sellingPrice' in rest ? { sellingPrice: rest.sellingPrice !== undefined ? Number(rest.sellingPrice) : null } : {}),
        ...('fbAdCost' in rest ? { fbAdCost: Number(rest.fbAdCost) || 0 } : {}),
        ...('deliveryCost' in rest ? { deliveryCost: Number(rest.deliveryCost) || 0 } : {}),
        ...('returnParcelQty' in rest ? { returnParcelQty: Number(rest.returnParcelQty) || 0 } : {}),
        ...('returnCost' in rest ? { returnCost: Number(rest.returnCost) || 0 } : {}),
        ...('damagedProductQty' in rest ? { damagedProductQty: Number(rest.damagedProductQty) || 0 } : {}),
        ...('damagedCost' in rest ? { damagedCost: Number(rest.damagedCost) || 0 } : {}),
        ...('monthlyBudget' in rest ? { monthlyBudget: Number(rest.monthlyBudget) || 0 } : {}),
        ...('desiredProfitPct' in rest ? { desiredProfitPct: rest.desiredProfitPct !== undefined ? Number(rest.desiredProfitPct) : null } : {}),
        ...('requiredMonthlyUnits' in rest ? { requiredMonthlyUnits: rest.requiredMonthlyUnits !== undefined ? Number(rest.requiredMonthlyUnits) : null } : {}),
        ...('requiredDailyUnits' in rest ? { requiredDailyUnits: rest.requiredDailyUnits !== undefined ? Number(rest.requiredDailyUnits) : null } : {}),
      }
    });
    // After update, if month/year provided, recalc shares for all entries in that month
    // Note: We don't update monthlyBudget here to avoid overwriting other fields
    // The frontend will handle monthly budget updates separately
    try {
      const month = rest.month || updated.month;
      const yearForCalc = (rest.year && Number(rest.year)) || (updated as { year?: number }).year || new Date().getFullYear();
      console.log(`📊 PUT: Recalculated budget shares for ${month} ${yearForCalc} (no automatic update to preserve fields)`);
    } catch (e) {
      console.error('Recalc share failed (PUT)', e);
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating ad product entry:', error);
    return NextResponse.json({ error: 'Failed to update ad product entry' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await db.adProductEntry.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ad product entry:', error);
    return NextResponse.json({ error: 'Failed to delete ad product entry' }, { status: 500 });
  }
}


