import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET all colors
export async function GET() {
  try {
    const colors = await db.color.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(colors);
  } catch (error) {
    console.error('Error fetching colors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch colors' },
      { status: 500 }
    );
  }
}

// POST create new color
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hexCode, description, isActive } = body;

    if (!name || !hexCode) {
      return NextResponse.json(
        { error: 'Color name and hex code are required' },
        { status: 400 }
      );
    }

    const color = await db.color.create({
      data: {
        name,
        hexCode,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(color, { status: 201 });
  } catch (error) {
    console.error('Error creating color:', error);
    return NextResponse.json(
      { error: 'Failed to create color' },
      { status: 500 }
    );
  }
}
