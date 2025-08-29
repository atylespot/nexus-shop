import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function GET() {
  try {
    const courierSetting = await prisma.courierSetting.findFirst();
    
    if (!courierSetting) {
      return NextResponse.json({ 
        message: 'No courier settings found',
        data: null 
      });
    }

    return NextResponse.json({ 
      message: 'Courier settings retrieved successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('Error fetching courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { apiKey, secretKey, baseUrl, isActive } = body;

    console.log('Received courier settings data:', { apiKey, secretKey, baseUrl, isActive });

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'API Key and Secret Key are required' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSetting = await prisma.courierSetting.findFirst();
    console.log('Existing setting found:', existingSetting);
    
    let courierSetting;
    
    if (existingSetting) {
      // Update existing settings
      courierSetting = await prisma.courierSetting.update({
        where: { id: existingSetting.id },
        data: {
          apiKey,
          secretKey,
          baseUrl: baseUrl || 'https://portal.packzy.com/api/v1',
          isActive: isActive ?? false
        }
      });
      console.log('Updated courier setting:', courierSetting);
    } else {
      // Create new settings
      courierSetting = await prisma.courierSetting.create({
        data: {
          apiKey,
          secretKey,
          baseUrl: baseUrl || 'https://portal.packzy.com/api/v1',
          isActive: isActive ?? false
        }
      });
      console.log('Created new courier setting:', courierSetting);
    }

    return NextResponse.json({ 
      message: 'Courier settings saved successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('Error saving courier settings:', error);
    
    // More detailed error information
    let errorMessage = 'Failed to save courier settings';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { isActive } = body;

    const existingSetting = await prisma.courierSetting.findFirst();
    
    if (!existingSetting) {
      return NextResponse.json(
        { error: 'No courier settings found' },
        { status: 404 }
      );
    }

    const courierSetting = await prisma.courierSetting.update({
      where: { id: existingSetting.id },
      data: { isActive }
    });

    return NextResponse.json({ 
      message: 'Courier settings updated successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('Error updating courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to update courier settings' },
      { status: 500 }
    );
  }
}
