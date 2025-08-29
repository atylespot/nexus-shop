import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const setting = await db.bDCourierSetting.findFirst();
    
    return NextResponse.json({ 
      message: 'BD Courier settings retrieved successfully',
      data: setting || { apiKey: '', isActive: false }
    });
  } catch (error) {
    console.error('Error fetching BD Courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch BD Courier settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, isActive } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'Valid API key is required' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSetting = await db.bDCourierSetting.findFirst();
    
    let setting;
    if (existingSetting) {
      // Update existing setting
      setting = await db.bDCourierSetting.update({
        where: { id: existingSetting.id },
        data: {
          apiKey,
          isActive: Boolean(isActive),
          updatedAt: new Date()
        }
      });
    } else {
      // Create new setting
      setting = await db.bDCourierSetting.create({
        data: {
          apiKey,
          isActive: Boolean(isActive)
        }
      });
    }

    return NextResponse.json({ 
      message: 'BD Courier settings saved successfully',
      data: setting
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving BD Courier settings:', error);
    return NextResponse.json(
      { error: 'Failed to save BD Courier settings' },
      { status: 500 }
    );
  }
}

