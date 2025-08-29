import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// GET - Fetch all selling targets or filter by adProductEntryId
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adProductEntryId = searchParams.get('adProductEntryId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let where: any = {};
    
    if (adProductEntryId) {
      where.adProductEntryId = parseInt(adProductEntryId);
    }
    
    if (month && year) {
      where.adProductEntry = {
        month: month,
        year: parseInt(year)
      };
    }

    const sellingTargets = await prisma.sellingTargetEntry.findMany({
      where,
      include: {
        adProductEntry: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            month: true,
            year: true,
            requiredDailyUnits: true
          }
        }
      },
      orderBy: [
        { adProductEntry: { month: 'asc' } },
        { adProductEntry: { year: 'asc' } },
        { date: 'asc' }
      ]
    });

    return NextResponse.json(sellingTargets);
  } catch (error) {
    console.error('Error fetching selling targets:', error);
    return NextResponse.json({ error: 'Failed to fetch selling targets' }, { status: 500 });
  }
}

// POST - Create a new selling target (optimized for speed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adProductEntryId, date, targetUnits, soldUnits } = body;

    if (!adProductEntryId || !date) {
      return NextResponse.json({ error: 'adProductEntryId and date are required' }, { status: 400 });
    }

    // Use upsert for better performance - no need to check if exists first
    const result = await prisma.sellingTargetEntry.upsert({
      where: {
        adProductEntryId_date: {
          adProductEntryId: parseInt(adProductEntryId),
          date: date
        }
      },
      update: {
        targetUnits: targetUnits !== undefined ? targetUnits : undefined,
        soldUnits: soldUnits !== undefined ? soldUnits : undefined
      },
      create: {
        adProductEntryId: parseInt(adProductEntryId),
        date: date,
        targetUnits: targetUnits || 0,
        soldUnits: soldUnits || 0
      },
      include: {
        adProductEntry: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            month: true,
            year: true,
            requiredDailyUnits: true
          }
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating/updating selling target:', error);
    return NextResponse.json({ error: 'Failed to create/update selling target' }, { status: 500 });
  }
}

// PUT - Update a selling target
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { targetUnits, soldUnits } = body;

    const updated = await prisma.sellingTargetEntry.update({
      where: { id: parseInt(id) },
      data: {
        targetUnits: targetUnits !== undefined ? targetUnits : undefined,
        soldUnits: soldUnits !== undefined ? soldUnits : undefined
      },
      include: {
        adProductEntry: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            month: true,
            year: true,
            requiredDailyUnits: true
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating selling target:', error);
    return NextResponse.json({ error: 'Failed to update selling target' }, { status: 500 });
  }
}

// DELETE - Delete a selling target
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.sellingTargetEntry.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Selling target deleted successfully' });
  } catch (error) {
    console.error('Error deleting selling target:', error);
    return NextResponse.json({ error: 'Failed to delete selling target' }, { status: 500 });
  }
}
