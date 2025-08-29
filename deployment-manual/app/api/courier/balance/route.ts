import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { SteadfastCourierService } from '@/lib/courier';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get courier settings
    const courierSetting = await prisma.courierSetting.findFirst();
    if (!courierSetting || !courierSetting.isActive) {
      return NextResponse.json(
        { error: 'Courier service is not configured or not active' },
        { status: 400 }
      );
    }

    // Initialize courier service
    const courierService = new SteadfastCourierService(
      courierSetting.apiKey,
      courierSetting.secretKey,
      courierSetting.baseUrl
    );

    // Get current balance
    const balanceResponse = await courierService.getCurrentBalance();

    if (balanceResponse.status !== 200) {
      throw new Error('Failed to get balance');
    }

    return NextResponse.json({ 
      message: 'Balance retrieved successfully',
      data: {
        currentBalance: balanceResponse.current_balance,
        currency: 'BDT'
      }
    });
  } catch (error) {
    console.error('Error getting courier balance:', error);
    return NextResponse.json(
      { error: 'Failed to get courier balance' },
      { status: 500 }
    );
  }
}
