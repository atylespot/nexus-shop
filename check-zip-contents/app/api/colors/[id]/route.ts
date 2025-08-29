import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET color by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    const color = await db.color.findUnique({
      where: { id: params.id }
    });

    if (!color) {
      return NextResponse.json(
        { error: 'Color not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(color);
  } catch (error) {
    console.error('Error fetching color:', error);
    return NextResponse.json(
      { error: 'Failed to fetch color' },
      { status: 500 }
    );
  }
}

// PUT update color
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    const body = await request.json();
    const { name, hexCode, description, isActive } = body;

    if (!name || !hexCode) {
      return NextResponse.json(
        { error: 'Color name and hex code are required' },
        { status: 400 }
      );
    }

    const color = await db.color.update({
      where: { id: params.id },
      data: {
        name,
        hexCode,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(color);
  } catch (error) {
    console.error('Error updating color:', error);
    return NextResponse.json(
      { error: 'Failed to update color' },
      { status: 500 }
    );
  }
}

// DELETE color
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    await db.color.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Color deleted successfully' });
  } catch (error) {
    console.error('Error deleting color:', error);
    return NextResponse.json(
      { error: 'Failed to delete color' },
      { status: 500 }
    );
  }
}
