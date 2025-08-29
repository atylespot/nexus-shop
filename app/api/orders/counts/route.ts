import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Lightweight counts endpoint for sidebar badges
export async function GET() {
  try {
    const [websiteCounts, landingCounts] = await Promise.all([
      db.order.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      db.landingPageOrder.groupBy({
        by: ['status'],
        _count: { status: true }
      })
    ]);

    const sumCounts = (entries: Array<{ status: string; _count: { status: number } }>) => {
      return entries.reduce<Record<string, number>>((acc, cur) => {
        acc[cur.status] = (acc[cur.status] || 0) + cur._count.status;
        return acc;
      }, {});
    };

    const web = sumCounts(websiteCounts as any);
    const land = sumCounts(landingCounts as any);

    const counts = {
      all: Object.values(web).reduce((a, b) => a + b, 0) + Object.values(land).reduce((a, b) => a + b, 0),
      pending: (web['pending'] || 0) + (land['pending'] || 0),
      processing: (web['processing'] || 0) + (land['processing'] || 0),
      'in-courier': (web['in-courier'] || 0) + (land['in-courier'] || 0),
      delivered: (web['delivered'] || 0) + (land['delivered'] || 0),
      cancelled: (web['cancelled'] || 0) + (land['cancelled'] || 0),
      refunded: (web['refunded'] || 0) + (land['refunded'] || 0)
    };

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Counts endpoint error:', error);
    return NextResponse.json({ counts: { all: 0, pending: 0, processing: 0, 'in-courier': 0, delivered: 0, cancelled: 0, refunded: 0 } });
  }
}



