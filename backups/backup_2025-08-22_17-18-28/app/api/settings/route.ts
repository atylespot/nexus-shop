import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const settings = await db.siteSetting.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'No site settings found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { header, banner, general, payment, shipping, footer } = body;

    console.log('API: Received settings data:', { header, banner, general, payment, shipping, footer });
    
    if (shipping) {
      console.log('API: Shipping data received:', shipping);
      console.log('API: Shipping zones:', shipping.zones);
    }

    // Check if settings already exist
    const existingSettings = await db.siteSetting.findFirst();

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await db.siteSetting.update({
        where: { id: existingSettings.id },
        data: {
          header: header || existingSettings.header,
          banner: banner || existingSettings.banner,
          general: general || existingSettings.general,
          payment: payment || existingSettings.payment,
          shipping: shipping || existingSettings.shipping,
          footer: footer || existingSettings.footer
        }
      });

      return NextResponse.json(updatedSettings);
    } else {
      // Create new settings
      const newSettings = await db.siteSetting.create({
        data: {
          header: header || {},
          banner: banner || {},
          general: general || {},
          payment: payment || {},
          shipping: shipping || {},
          footer: footer || {}
        }
      });

      return NextResponse.json(newSettings, { status: 201 });
    }
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update site settings' },
      { status: 500 }
    );
  }
}
