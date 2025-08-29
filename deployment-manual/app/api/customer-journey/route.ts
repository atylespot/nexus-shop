import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectDistrictThanaFromAddress } from '@/lib/bdLocationDetect';

// GET /api/customer-journey
// Returns unified table rows from orders, landing orders and journey events
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const rangeDays = Math.min(parseInt(url.searchParams.get('range') || '30'), 365);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
    const pageSize = Math.min(Math.max(parseInt(url.searchParams.get('pageSize') || '10'), 1), 100);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - rangeDays);

    // Helper to normalize BD phone
    const normalizeBDPhone = (phone?: string | null): string => {
      if (!phone) return '';
      let digits = String(phone).replace(/[^0-9]/g, '');
      if (digits.startsWith('00')) digits = digits.slice(2);
      if (digits.startsWith('880')) return digits;
      if (digits.startsWith('01') && digits.length === 11) return `880${digits.slice(1)}`;
      return digits;
    };

    // Collect order phones within range for abandoned detection
    const [orders, lpOrders] = await Promise.all([
      db.order.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { phone: true }
      }),
      db.landingPageOrder.findMany({
        where: { orderDate: { gte: start, lte: end } },
        select: { customerPhone: true }
      })
    ]);
    const orderPhoneSet = new Set<string>();
    for (const o of orders) orderPhoneSet.add(normalizeBDPhone(o.phone));
    for (const o of lpOrders) orderPhoneSet.add(normalizeBDPhone(o.customerPhone));

    // Retention cleanup based on settings
    try {
      const s = await db.journeyRetentionSetting.findUnique({ where: { id: 1 } });
      const retentionDays = s?.retentionDays ?? 30;
      if (retentionDays > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);
        // Best-effort async cleanup; do not await heavily
        db.customerJourneyEvent.deleteMany({ where: { eventTime: { lt: cutoff } } }).catch(() => {});
      }
    } catch {}

    // Journey events (views/checkout without order)
    const events = await db.customerJourneyEvent.findMany({
      where: { eventTime: { gte: start, lte: end } },
      orderBy: { eventTime: 'desc' }
    });

    // Build rows from events only (exclude order_placed)
    const allRows: any[] = [];
    let totalViews = 0;
    let totalCheckoutForm = 0;
    let totalCheckoutFilled = 0;
    let totalAbandoned = 0;
    const byDistrict = new Map<string, { views: number; checkout_form: number; checkout_filled: number; abandoned: number }>();
    const byThana = new Map<string, { views: number; checkout_form: number; checkout_filled: number; abandoned: number }>();

    const bump = (m: Map<string, any>, key: string, field: string) => {
      if (!key) return;
      const curr = m.get(key) || { views: 0, checkout_form: 0, checkout_filled: 0, abandoned: 0 };
      curr[field] += 1;
      m.set(key, curr);
    };

    // No grouping: every event creates its own row
    for (const e of events) {
      if (e.status === 'order_placed') continue;
      const phoneNorm = normalizeBDPhone(e.phone);
      const isCheckout = e.status?.startsWith('checkout');
      const abandoned = isCheckout && phoneNorm ? !orderPhoneSet.has(phoneNorm) : false;

      // Enrich district/thana if missing
      let districtValue = e.district || '';
      let thanaValue = e.thana || '';
      if (!districtValue || !thanaValue) {
        const detected = detectDistrictThanaFromAddress(e.address || undefined, e.district || undefined, e.thana || undefined);
        districtValue = districtValue || detected?.district || '';
        thanaValue = thanaValue || detected?.thana || '';
      }

      if (e.status === 'view') { totalViews += 1; bump(byDistrict, districtValue || '', 'views'); bump(byThana, thanaValue || '', 'views'); }
      else if (e.status === 'checkout_form') { totalCheckoutForm += 1; bump(byDistrict, districtValue || '', 'checkout_form'); bump(byThana, thanaValue || '', 'checkout_form'); }
      else if (e.status === 'checkout_filled') { totalCheckoutFilled += 1; bump(byDistrict, districtValue || '', 'checkout_filled'); bump(byThana, thanaValue || '', 'checkout_filled'); }
      if (abandoned) { totalAbandoned += 1; bump(byDistrict, districtValue || '', 'abandoned'); bump(byThana, thanaValue || '', 'abandoned'); }

      allRows.push({
        id: `evt_${e.id}`,
        source: e.source === 'landing_page' ? 'LP' : 'WEB',
        customerName: e.customerName || '',
        phone: e.phone || '',
        address: e.address || '',
        district: districtValue || '',
        thana: thanaValue || '',
        productName: e.productName || '',
        productImage: e.productImage || undefined,
        status: e.status,
        abandoned,
        eventTime: e.eventTime
      });
    }

    allRows.sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime());
    const totalRows = allRows.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    const offset = (page - 1) * pageSize;
    const rows = allRows.slice(offset, offset + pageSize);

    const district = Array.from(byDistrict.entries()).map(([k, v]) => ({ district: k || 'Unknown', ...v }));
    const thana = Array.from(byThana.entries()).map(([k, v]) => ({ thana: k || 'Unknown', ...v }));

    return NextResponse.json({
      rows,
      totalRows,
      page,
      pageSize,
      totalPages,
      totals: { views: totalViews, checkout_form: totalCheckoutForm, checkout_filled: totalCheckoutFilled, abandoned: totalAbandoned },
      byDistrict: district,
      byThana: thana
    });
  } catch (error) {
    console.error('Customer Journey API error:', error);
    return NextResponse.json({ error: 'Failed to load journey' }, { status: 500 });
  }
}

// POST /api/customer-journey -> log an event (from client)
// body: { source, pageType, status, sessionId, customerName, phone, address, district, thana, productId, productName, productImage, landingPageId, landingPageSlug, orderId }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await db.customerJourneyEvent.create({ data: {
      source: body.source || 'website',
      pageType: body.pageType || null,
      status: body.status || 'view',
      sessionId: body.sessionId || null,
      fullName: body.fullName || null,
      email: body.email || null,
      customerName: body.customerName || null,
      phone: body.phone || null,
      address: body.address || null,
      district: body.district || null,
      thana: body.thana || null,
      productId: body.productId || null,
      productName: body.productName || null,
      productImage: body.productImage || null,
      landingPageId: body.landingPageId || null,
      landingPageSlug: body.landingPageSlug || null,
      orderId: body.orderId || null
    }});
    return NextResponse.json({ ok: true, id: saved.id });
  } catch (error) {
    console.error('Customer Journey log error:', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}


