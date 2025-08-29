import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log('📬 Steadfast Webhook Received:', payload);
    // TODO: Map delivery_status / tracking_update to internal models if needed
    return NextResponse.json({ status: 'success', message: 'Webhook received successfully.' });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error?.message || 'Invalid consignment ID.' },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}


