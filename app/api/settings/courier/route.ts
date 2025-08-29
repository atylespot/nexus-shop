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
    console.log('🔍 Fetching courier settings...');
    
    // Test database connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const courierSetting = await prisma.courierSetting.findFirst();
    
    if (!courierSetting) {
      console.log('❌ No courier settings found');
      return NextResponse.json({ 
        message: 'No courier settings found',
        data: null 
      });
    }

    console.log('✅ Courier settings found:', {
      id: courierSetting.id,
      apiKey: courierSetting.apiKey ? `${courierSetting.apiKey.substring(0, 8)}...` : 'Not set',
      secretKey: courierSetting.secretKey ? `${courierSetting.secretKey.substring(0, 8)}...` : 'Not set',
      baseUrl: courierSetting.baseUrl,
      isActive: courierSetting.isActive,
      updatedAt: courierSetting.updatedAt
    });

    return NextResponse.json({ 
      message: 'Courier settings retrieved successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('❌ Error fetching courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courier settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💾 Saving courier settings...');
    
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

    console.log('📋 Received courier settings data:', { 
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set',
      secretKey: secretKey ? `${secretKey.substring(0, 8)}...` : 'Not set',
      baseUrl, 
      isActive 
    });

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'API Key and Secret Key are required' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSetting = await prisma.courierSetting.findFirst();
    console.log('🔍 Existing setting found:', existingSetting ? 'Yes' : 'No');
    
    let courierSetting;
    
    if (existingSetting) {
      // Update existing settings
      console.log('🔄 Updating existing courier settings...');
      courierSetting = await prisma.courierSetting.update({
        where: { id: existingSetting.id },
        data: {
          apiKey,
          secretKey,
          baseUrl: baseUrl || 'https://portal.packzy.com/api/v1',
          isActive: isActive ?? false
        }
      });
      console.log('✅ Updated courier setting successfully');
    } else {
      // Create new settings
      console.log('🆕 Creating new courier settings...');
      courierSetting = await prisma.courierSetting.create({
        data: {
          apiKey,
          secretKey,
          baseUrl: baseUrl || 'https://portal.packzy.com/api/v1',
          isActive: isActive ?? false
        }
      });
      console.log('✅ Created new courier setting successfully');
    }

    // Return success response with masked sensitive data
    const responseData = {
      ...courierSetting,
      apiKey: courierSetting.apiKey ? `${courierSetting.apiKey.substring(0, 8)}...` : '',
      secretKey: courierSetting.secretKey ? `${courierSetting.secretKey.substring(0, 8)}...` : ''
    };

    return NextResponse.json({ 
      message: 'Courier settings saved successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('❌ Error saving courier settings:', error);
    
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
    console.log('🔄 Updating courier service status...');
    
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

    console.log(`✅ Courier service ${isActive ? 'activated' : 'deactivated'} successfully`);

    return NextResponse.json({ 
      message: 'Courier settings updated successfully',
      data: courierSetting 
    });
  } catch (error) {
    console.error('❌ Error updating courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to update courier settings' },
      { status: 500 }
    );
  }
}
