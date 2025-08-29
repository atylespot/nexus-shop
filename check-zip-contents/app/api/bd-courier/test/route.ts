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
    if (!setting || !setting.isActive) {
      return NextResponse.json(
        { error: 'BD Courier integration is not configured or not active' },
        { status: 400 }
      );
    }

    console.log('🧪 BD Courier Test API called for phone:', phone);
    console.log('🔑 Using API Key:', setting.apiKey.substring(0, 10) + '...');

    // Call BD Courier API
    const response = await fetch('https://bdcourier.com/api/courier-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${setting.apiKey}`
      },
      body: JSON.stringify({ phone })
    });

    console.log('📡 BD Courier API Response Status:', response.status);
    console.log('📡 BD Courier API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ BD Courier API error:', errorData);
      return NextResponse.json(
        { error: `BD Courier API error: ${response.status} ${response.statusText}`, details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📊 Raw BD Courier Test Response:', JSON.stringify(data, null, 2));
    
    // Log the structure analysis based on actual API response
    console.log('🔍 Response Structure Analysis:');
    console.log('- Has courierData property:', !!data.courierData);
    console.log('- Has data property:', !!data.data);
    console.log('- Top level keys:', Object.keys(data));
    
    if (data.courierData) {
      console.log('- CourierData level keys:', Object.keys(data.courierData));
      console.log('- Pathao structure:', data.courierData.pathao ? {
        type: typeof data.courierData.pathao,
        keys: Object.keys(data.courierData.pathao),
        total_parcel: data.courierData.pathao.total_parcel,
        success_parcel: data.courierData.pathao.success_parcel,
        cancelled_parcel: data.courierData.pathao.cancelled_parcel
      } : 'undefined');
      console.log('- SteadFast structure:', data.courierData.steadfast ? {
        type: typeof data.courierData.steadfast,
        keys: Object.keys(data.courierData.steadfast),
        total_parcel: data.courierData.steadfast.total_parcel,
        success_parcel: data.courierData.steadfast.success_parcel,
        cancelled_parcel: data.courierData.steadfast.cancelled_parcel
      } : 'undefined');
      console.log('- ParcelDex structure:', data.courierData.parceldex ? {
        type: typeof data.courierData.parceldex,
        keys: Object.keys(data.courierData.parceldex),
        total_parcel: data.courierData.parceldex.total_parcel,
        success_parcel: data.courierData.parceldex.success_parcel,
        cancelled_parcel: data.courierData.parceldex.cancelled_parcel
      } : 'undefined');
      console.log('- REDX structure:', data.courierData.redx ? {
        type: typeof data.courierData.redx,
        keys: Object.keys(data.courierData.redx),
        total_parcel: data.courierData.redx.total_parcel,
        success_parcel: data.courierData.redx.success_parcel,
        cancelled_parcel: data.courierData.redx.cancelled_parcel
      } : 'undefined');
      console.log('- PAPERFLY structure:', data.courierData.paperfly ? {
        type: typeof data.courierData.paperfly,
        keys: Object.keys(data.courierData.paperfly),
        total_parcel: data.courierData.paperfly.total_parcel,
        success_parcel: data.courierData.paperfly.success_parcel,
        cancelled_parcel: data.courierData.paperfly.cancelled_parcel
      } : 'undefined');
      
      if (data.courierData.summary) {
        console.log('- Summary structure:', {
          type: typeof data.courierData.summary,
          keys: Object.keys(data.courierData.summary),
          total_parcel: data.courierData.summary.total_parcel,
          success_parcel: data.courierData.summary.success_parcel,
          cancelled_parcel: data.courierData.summary.cancelled_parcel,
          success_ratio: data.courierData.summary.success_ratio
        });
      }
    }
    
    return NextResponse.json({ 
      message: 'BD Courier API test successful',
      data: data,
      phone: phone,
      timestamp: new Date().toISOString(),
      structure: {
        hasCourierData: !!data.courierData,
        hasData: !!data.data,
        topLevelKeys: Object.keys(data),
        courierDataKeys: data.courierData ? Object.keys(data.courierData) : [],
        courierStructures: data.courierData ? {
          pathao: data.courierData.pathao ? { 
            type: typeof data.courierData.pathao, 
            keys: Object.keys(data.courierData.pathao),
            total_parcel: data.courierData.pathao.total_parcel,
            success_parcel: data.courierData.pathao.success_parcel,
            cancelled_parcel: data.courierData.pathao.cancelled_parcel
          } : null,
          steadfast: data.courierData.steadfast ? { 
            type: typeof data.courierData.steadfast, 
            keys: Object.keys(data.courierData.steadfast),
            total_parcel: data.courierData.steadfast.total_parcel,
            success_parcel: data.courierData.steadfast.success_parcel,
            cancelled_parcel: data.courierData.steadfast.cancelled_parcel
          } : null,
          parceldex: data.courierData.parceldex ? { 
            type: typeof data.courierData.parceldex, 
            keys: Object.keys(data.courierData.parceldex),
            total_parcel: data.courierData.parceldex.total_parcel,
            success_parcel: data.courierData.parceldex.success_parcel,
            cancelled_parcel: data.courierData.parceldex.cancelled_parcel
          } : null,
          redx: data.courierData.redx ? { 
            type: typeof data.courierData.redx, 
            keys: Object.keys(data.courierData.redx),
            total_parcel: data.courierData.redx.total_parcel,
            success_parcel: data.courierData.redx.success_parcel,
            cancelled_parcel: data.courierData.redx.cancelled_parcel
          } : null,
          paperfly: data.courierData.paperfly ? { 
            type: typeof data.courierData.paperfly, 
            keys: Object.keys(data.courierData.paperfly),
            total_parcel: data.courierData.paperfly.total_parcel,
            success_parcel: data.courierData.paperfly.success_parcel,
            cancelled_parcel: data.courierData.paperfly.cancelled_parcel
          } : null,
        } : null,
        summary: data.courierData?.summary ? {
          type: typeof data.courierData.summary,
          keys: Object.keys(data.courierData.summary),
          total_parcel: data.courierData.summary.total_parcel,
          success_parcel: data.courierData.summary.success_parcel,
          cancelled_parcel: data.courierData.summary.cancelled_parcel,
          success_ratio: data.courierData.summary.success_ratio
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error testing BD Courier API:', error);
    return NextResponse.json(
      { error: 'Failed to test BD Courier API', details: String(error) },
      { status: 500 }
    );
  }
}

