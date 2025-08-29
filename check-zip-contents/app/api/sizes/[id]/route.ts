import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET size by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    const size = await db.size.findUnique({
      where: { id: params.id }
    });

    if (!size) {
      return NextResponse.json(
        { error: 'Size not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(size);
  } catch (error) {
    console.error('Error fetching size:', error);
    return NextResponse.json(
      { error: 'Failed to fetch size' },
      { status: 500 }
    );
  }
}

// PUT update size
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    const body = await request.json();
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Size name is required' },
        { status: 400 }
      );
    }

    const size = await db.size.update({
      where: { id: params.id },
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(size);
  } catch (error) {
    console.error('Error updating size:', error);
    return NextResponse.json(
      { error: 'Failed to update size' },
      { status: 500 }
    );
  }
}

// DELETE size
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { $1 } = await params;
    await db.size.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Size deleted successfully' });
  } catch (error) {
    console.error('Error deleting size:', error);
    return NextResponse.json(
      { error: 'Failed to delete size' },
      { status: 500 }
    );
  }
}
