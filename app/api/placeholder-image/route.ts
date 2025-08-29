import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || 'product';
    
    // Create a simple SVG placeholder image
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f3f4f6"/>
        <text x="100" y="100" font-family="Arial" font-size="14" fill="#6b7280" text-anchor="middle" dy=".3em">
          ${name}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error generating placeholder image:', error);
    return NextResponse.json(
      { error: 'Failed to generate placeholder image' },
      { status: 500 }
    );
  }
}
