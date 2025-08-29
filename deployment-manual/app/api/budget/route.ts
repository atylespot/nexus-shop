import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all budget entries
export async function GET() {
  try {
    const budgetEntries = await prisma.budgetEntry.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(budgetEntries);
  } catch (error) {
    console.error('Error fetching budget entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget entries' },
      { status: 500 }
    );
  }
}

// POST - Create new budget entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, expenseType, amount, currency, note, year } = body;

    // Validation
    if (!month || !expenseType || !amount) {
      return NextResponse.json(
        { error: 'Month, expense type, and amount are required' },
        { status: 400 }
      );
    }

    const budgetEntry = await prisma.budgetEntry.create({
      data: {
        month,
        year: year ? parseInt(year) : new Date().getFullYear(),
        expenseType,
        amount: parseFloat(amount),
        currency: currency || 'BDT',
        note: note || ''
      }
    });

    return NextResponse.json(budgetEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating budget entry:', error);
    return NextResponse.json(
      { error: 'Failed to create budget entry' },
      { status: 500 }
    );
  }
}

// PUT - Update budget entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, month, expenseType, amount, currency, note, year } = body;

    // Validation
    if (!id || !month || !expenseType || !amount) {
      return NextResponse.json(
        { error: 'ID, month, expense type, and amount are required' },
        { status: 400 }
      );
    }

    const budgetEntry = await prisma.budgetEntry.update({
      where: { id: parseInt(id) },
      data: {
        month,
        year: year ? parseInt(year) : new Date().getFullYear(),
        expenseType,
        amount: parseFloat(amount),
        currency: currency || 'BDT',
        note: note || '',
        updatedAt: new Date()
      }
    });

    return NextResponse.json(budgetEntry);
  } catch (error) {
    console.error('Error updating budget entry:', error);
    return NextResponse.json(
      { error: 'Failed to update budget entry' },
      { status: 500 }
    );
  }
}

// DELETE - Delete budget entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await prisma.budgetEntry.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: 'Budget entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget entry' },
      { status: 500 }
    );
  }
}
