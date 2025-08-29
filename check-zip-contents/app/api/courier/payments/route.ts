import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SteadfastCourierService } from '@/lib/courier';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page') as string, 10) : undefined;
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') as string, 10) : undefined;

    const courierSetting = await prisma.courierSetting.findFirst();
    if (!courierSetting || !courierSetting.isActive) {
      return NextResponse.json(
        { error: 'Courier service is not configured or not active' },
        { status: 400 }
      );
    }

    const courierService = new SteadfastCourierService(
      courierSetting.apiKey,
      courierSetting.secretKey,
      courierSetting.baseUrl
    );

    try {
      const result = await courierService.getPaymentHistory({ from, to, page, pageSize });
      return NextResponse.json({
        message: 'Payment history fetched successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (externalError: any) {
      console.error('❌ Error fetching courier payment history:', externalError);
      // Fallback: Build an internal summary from delivered courier orders within range
      const toDate = to ? new Date(to) : new Date();
      const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 60 * 24 * 60 * 60 * 1000); // last 60 days default

      // Pull delivered courier orders in the range
      const deliveredOrders = await prisma.courierOrder.findMany({
        where: {
          courierStatus: 'delivered',
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        }
      });

      // Fetch source website and landing orders in bulk to compute COD totals
      const websiteIds = deliveredOrders.filter(o => o.orderType === 'website').map(o => o.orderId);
      const landingIds = deliveredOrders.filter(o => o.orderType === 'landing_page').map(o => o.orderId);

      const [websiteOrders, landingOrders] = await Promise.all([
        websiteIds.length ? prisma.order.findMany({ where: { id: { in: websiteIds } } }) : Promise.resolve([]),
        landingIds.length ? prisma.landingPageOrder.findMany({ where: { id: { in: landingIds } } }) : Promise.resolve([])
      ]);

      const websiteMap = new Map(websiteOrders.map(o => [o.id, o]));
      const landingMap = new Map(landingOrders.map(o => [o.id, o]));

      // Group by date (YYYY-MM-DD)
      const toKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };

      const grouped: Record<string, { delivered_count: number; total_cod: number; delivery_charge: number } > = {};
      for (const co of deliveredOrders) {
        const key = toKey(new Date(co.createdAt));
        if (!grouped[key]) {
          grouped[key] = { delivered_count: 0, total_cod: 0, delivery_charge: 0 };
        }
        grouped[key].delivered_count += 1;
        grouped[key].delivery_charge += co.deliveryCharge || 0;

        if (co.orderType === 'website') {
          const src = websiteMap.get(co.orderId);
          if (src) grouped[key].total_cod += src.total || 0;
        } else {
          const src = landingMap.get(co.orderId);
          if (src) grouped[key].total_cod += src.totalAmount || 0;
        }
      }

      const items = Object.entries(grouped)
        .sort((a, b) => a[0] < b[0] ? 1 : -1) // newest first
        .map(([date, g]) => ({
          date,
          delivered_count: g.delivered_count,
          delivery_charge: Number(g.delivery_charge.toFixed(2)),
          amount: Number(g.total_cod.toFixed(2)),
          returned_count: 0,
          statement_no: undefined,
          cod_charge: undefined,
          adjustment: undefined,
          invoice_no: undefined,
          id: date
        }));

      return NextResponse.json({
        message: 'Fallback: internal delivered orders summary',
        data: items,
        pagination: {
          page: 1,
          pageSize: items.length,
          total: items.length,
          totalPages: 1
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Error fetching courier payment history:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch payment history' }, { status: 500 });
  }
}


