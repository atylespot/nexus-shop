import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET all sizes
export async function GET() {
  try {
    const sizes = await db.size.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(sizes);
  } catch (error) {
    console.error('Error fetching sizes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sizes' },
      { status: 500 }
    );
  }
}

// POST create new size
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      );
    }

    const size = await db.size.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(size, { status: 201 });
  } catch (error) {
    console.error('Error creating size:', error);
    return NextResponse.json(
      { error: 'Failed to create size' },
      { status: 500 }
    );
  }
}
