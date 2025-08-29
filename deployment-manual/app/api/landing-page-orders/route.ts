import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const orders = await db.landingPageOrder.findMany({
      include: {
        product: true
      },
      orderBy: {
        orderDate: 'desc'
      }
    });

    return NextResponse.json({
      message: 'Landing page orders fetched successfully',
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching landing page orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch landing page orders' },
      { status: 500 }
    );
  }
}
