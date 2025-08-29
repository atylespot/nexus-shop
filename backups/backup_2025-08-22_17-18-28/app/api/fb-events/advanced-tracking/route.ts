import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from "@/lib/db";

// SHA256 hashing function for sensitive data
function hashData(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

// Get client IP address
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return '127.0.0.1'; // fallback
}

export async function POST(req: NextRequest) {
  try {
    console.log('Advanced tracking API called');
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const {
      event_name,
      user_data = {},
      custom_data = {},
      pixelId: bodyPixelId,
      accessToken: bodyAccessToken,
      test_event_code: bodyTestCode,
      // Advanced tracking parameters
      fbc, // Facebook Click ID
      email,
      phone,
      external_id,
      fb_login_id,
      ip_address,
      user_agent
    } = body;

    // Get pixel settings from database or environment variables
    console.log('Fetching pixel settings from database...');
    const setting = await db.pixelSetting.findFirst();
    console.log('Database setting:', setting);
    
    const pixelId = bodyPixelId || process.env.FB_PIXEL_ID || setting?.fbPixelId;
    const accessToken = bodyAccessToken || process.env.FB_ACCESS_TOKEN || setting?.fbAccessToken;
    const test_event_code = bodyTestCode || process.env.FB_TEST_EVENT_CODE || setting?.fbTestEventCode;

    console.log('Resolved values:', { pixelId: !!pixelId, accessToken: !!accessToken, test_event_code: !!test_event_code });

    if (!pixelId || !accessToken) {
      console.log('Missing credentials:', { pixelId: !!pixelId, accessToken: !!accessToken });
      return NextResponse.json({ 
        success: false,
        error: "Missing Pixel ID or Access Token",
        message: "Please configure Pixel ID and Access Token in settings",
        debug: {
          bodyPixelId: !!bodyPixelId,
          envPixelId: !!process.env.FB_PIXEL_ID,
          dbPixelId: !!setting?.fbPixelId,
          bodyAccessToken: !!bodyAccessToken,
          envAccessToken: !!process.env.FB_ACCESS_TOKEN,
          dbAccessToken: !!setting?.fbAccessToken
        }
      }, { status: 400 });
    }

    // Get user agent if not provided
    const clientUA = user_agent || req.headers.get('user-agent') || '';

    // Prepare advanced user_data with ONLY Facebook Conversion API supported parameters
    const advancedUserData = {
      // Facebook Conversion API officially supported parameters
      fbc: fbc || getFBC(), // Click ID - SUPPORTED
      fbp: user_data.fbp || getFBP(), // Browser ID - SUPPORTED
      
      // Only include if Facebook accepts them
      ...(email && { em: hashData(email) }), // Hashed Email - MAYBE SUPPORTED
      ...(phone && { ph: hashData(phone) }), // Hashed Phone - MAYBE SUPPORTED
      ...(external_id && { external_id }), // External ID - MAYBE SUPPORTED
      ...(fb_login_id && { fb_login_id }), // Facebook Login ID - MAYBE SUPPORTED
    };

    // Remove undefined values
    Object.keys(advancedUserData).forEach(key => {
      if (advancedUserData[key] === undefined) {
        delete advancedUserData[key];
      }
    });

    // Facebook Conversion API payload
    const conversionPayload = {
      data: [{
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        user_data: advancedUserData,
        custom_data: {
          ...custom_data,
          // Ensure required fields for better event match quality
          content_type: custom_data?.content_type || 'product',
          num_items: custom_data?.num_items || 1,
          event_source_url: custom_data?.event_source_url || 'http://localhost:3000'
        },
        event_source_url: req.headers.get('referer') || 'http://localhost:3000',
        action_source: 'website',
        event_id: generateEventId()
      }]
    };

    // Send to Facebook Conversion API
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;
    const fbResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: conversionPayload.data,
        ...(test_event_code && { test_event_code })
      })
    });

    const fbResult = await fbResponse.json();

    console.log('Facebook API response:', fbResponse.status, fbResult);
    
    if (fbResponse.ok && fbResult.events_received === 1) {
      return NextResponse.json({
        success: true,
        events_received: fbResult.events_received,
        message: 'Advanced tracking event sent successfully',
        tracking_data: {
          event_name,
          parameters_sent: Object.keys(advancedUserData).length,
          critical_parameters: {
            fbc: !!advancedUserData.fbc,
            ip: !!advancedUserData.ip,
            em: !!advancedUserData.em,
            ph: !!advancedUserData.ph,
            external_id: !!advancedUserData.external_id,
            fb_login_id: !!advancedUserData.fb_login_id
          }
        }
      });
    } else {
      console.log('Facebook API error:', fbResult);
      return NextResponse.json({
        success: false,
        error: fbResult.error?.message || fbResult.error || 'Facebook API error',
        message: fbResult.error?.message || 'Failed to send event to Facebook',
        debug: {
          facebook_response: fbResult,
          status_code: fbResponse.status,
          parameters_sent: Object.keys(advancedUserData).length
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Advanced tracking error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message
    }, { status: 500 });
  }
}

// Helper functions
function getFBP(): string {
  // Generate or retrieve Facebook Browser ID
  return `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
}

function getFBC(): string {
  // Generate or retrieve Facebook Click ID
  return `fb.1.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
