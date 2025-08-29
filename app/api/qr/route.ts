import { NextRequest, NextResponse } from "next/server";

// Lightweight QR generation without extra deps: use quickchart API as a fallback
// If you want server-side generation, we can add 'qrcode' later.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = (searchParams.get('provider') || '').toLowerCase();
    const number = searchParams.get('number') || '';
    if (!provider || !number) {
      return NextResponse.json({ error: 'provider and number required' }, { status: 400 });
    }
    // Compose payload text (simple scheme text customers can scan/save)
    const text = `${provider.toUpperCase()} PAY TO: ${number}`;
    const chartUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=300`;
    // Return the external URL directly; frontend will save in settings
    return NextResponse.json({ url: chartUrl });
  } catch (e) {
    console.error('QR API error:', e);
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}


