import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const setting = await db.pixelSetting.findFirst();
    
    if (setting) {
      // Check if test event code has expired (12 hours)
      const now = new Date();
      const testEventCodeCreatedAt = setting.testEventCodeCreatedAt;
      
      if (testEventCodeCreatedAt) {
        const hoursSinceCreation = (now.getTime() - testEventCodeCreatedAt.getTime()) / (1000 * 60 * 60);
        
        // If more than 12 hours have passed, clear the test event code
        if (hoursSinceCreation > 12) {
          await db.pixelSetting.update({
            where: { id: setting.id },
            data: {
              fbTestEventCode: null,
              testEventCodeCreatedAt: null
            }
          });
          
          // Return updated setting without test event code
          return NextResponse.json({
            ...setting,
            fbTestEventCode: null,
            testEventCodeCreatedAt: null,
            testEventCodeExpired: true
          });
        }
      }
    }
    
    return NextResponse.json(setting || {});
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load pixel settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fbPixelId, fbAccessToken, fbTestEventCode, ttPixelId, ttAccessToken } = body;
    
    const existing = await db.pixelSetting.findFirst();
    
    // Prepare data with test event code expiry tracking
    const data: any = {
      fbPixelId: fbPixelId || null,
      fbAccessToken: fbAccessToken || null,
      ttPixelId: ttPixelId || null,
      ttAccessToken: ttAccessToken || null,
    };
    
    // Handle test event code with expiry
    if (fbTestEventCode) {
      data.fbTestEventCode = fbTestEventCode;
      data.testEventCodeCreatedAt = new Date(); // Set creation time
    } else if (existing?.fbTestEventCode) {
      // If test event code is being cleared, also clear the creation time
      data.fbTestEventCode = null;
      data.testEventCodeCreatedAt = null;
    }
    
    const saved = existing
      ? await db.pixelSetting.update({ where: { id: existing.id }, data })
      : await db.pixelSetting.create({ data });
    
    return NextResponse.json(saved);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save pixel settings' }, { status: 500 });
  }
}


