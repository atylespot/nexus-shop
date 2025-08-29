import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number is required' },
        { status: 400 }
      );
    }

    // Get BD Courier settings
    const setting = await db.bDCourierSetting.findFirst();
    if (!setting || !setting.isActive || !setting.apiKey) {
      return NextResponse.json(
        { error: 'BD Courier integration is not configured or not active' },
        { status: 400 }
      );
    }

    console.log('🔍 BD Courier Track API called for phone:', phone);
    console.log('🔑 Using API Key:', setting.apiKey.substring(0, 10) + '...');

    // Call BD Courier API for external data only
    const bdCourierResponse = await fetch('https://bdcourier.com/api/courier-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${setting.apiKey}`
      },
      body: JSON.stringify({ phone })
    });

    console.log('📡 BD Courier API Response Status:', bdCourierResponse.status);

    if (!bdCourierResponse.ok) {
      const errText = await bdCourierResponse.text();
      console.error('❌ BD Courier API Error:', errText);
      return NextResponse.json(
        { error: `BD Courier API error: ${bdCourierResponse.status} ${bdCourierResponse.statusText}`, details: errText },
        { status: bdCourierResponse.status }
      );
    }

    const bdCourierData = await bdCourierResponse.json();
    console.log('📊 Raw BD Courier Response:', JSON.stringify(bdCourierData, null, 2));

    // Extract data from response - based on actual API response structure
    // The API returns data in courierData field, not data field
    const courierData = bdCourierData?.courierData || {};
    console.log('🔍 Extracted courier data:', JSON.stringify(courierData, null, 2));

    // Helper to extract totals from courier data structure
    const extractCourierTotals = (courierNode: any, courierName: string) => {
      console.log(`🔍 Processing ${courierName}:`, courierNode);
      
      if (!courierNode) {
        console.log(`❌ ${courierName}: No data`);
        return { total: 0, success: 0, cancel: 0 };
      }

      // Extract from the actual API response structure
      const total = courierNode.total_parcel || 0;
      const success = courierNode.success_parcel || 0;
      const cancel = courierNode.cancelled_parcel || 0;
      
      const result = { total, success, cancel };
      console.log(`✅ ${courierName}: Extracted totals`, result);
      return result;
    };

    // Extract courier performance data
    const pathao = extractCourierTotals(courierData.pathao, 'Pathao');
    const steadfast = extractCourierTotals(courierData.steadfast, 'SteadFast');
    const parceldex = extractCourierTotals(courierData.parceldex, 'ParcelDex');
    const redx = extractCourierTotals(courierData.redx, 'REDX');
    const paperfly = extractCourierTotals(courierData.paperfly, 'PAPERFLY');

    const courierPerformance = { pathao, steadfast, parceldex, redx, paperfly };
    console.log('📊 Final Courier Performance:', JSON.stringify(courierPerformance, null, 2));

    // Use summary data if available, otherwise calculate from individual couriers
    const summary = courierData.summary || {};
    const totalParcels = summary.total_parcel || (pathao.total + steadfast.total + parceldex.total + redx.total + paperfly.total);
    const successParcels = summary.success_parcel || (pathao.success + steadfast.success + parceldex.success + redx.success + paperfly.success);
    const cancelledParcels = summary.cancelled_parcel || (pathao.cancel + steadfast.cancel + parceldex.cancel + redx.cancel + paperfly.cancel);
    const successRate = summary.success_ratio || (totalParcels > 0 ? Math.round((successParcels / totalParcels) * 100) : 0);

    console.log('📈 Calculated Metrics:', {
      totalParcels,
      successParcels,
      cancelledParcels,
      successRate,
      summary: summary
    });

    const responseData = {
      customer: {
        phone,
        totalParcels,
        successParcels,
        cancelledParcels,
        successRate,
      },
      courierPerformance,
      courierData: bdCourierData,
      orders: [], // External API may not provide per-order details
    };

    return NextResponse.json({
      message: 'Customer tracking data retrieved successfully',
      data: responseData,
      phone,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in BD Courier track API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer tracking data', details: String(error) },
      { status: 500 }
    );
  }
}
