import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const settings = await prisma.chatBotSetting.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.chatBotSetting.create({
        data: {
          isEnabled: true,
          welcomeMessage: "স্বাগতম! আমি আপনার সাহায্য করতে পারি।",
          aiModel: "gpt-4o-mini",
          maxTokens: 1000,
          temperature: 0.7,
                           systemPrompt: `You are a highly intelligent and helpful AI assistant for Nexus Shop, an e-commerce website. Follow these guidelines strictly:
 
 **Language**: Always respond in Bengali (Bangla) language.
 
 **Page Context Awareness**:
 - You know which page the customer is currently on
 - Use this context to provide more relevant responses
 - If they're on a product page, you can reference that product
 - If they're on checkout, help with payment/order issues
 - If they're on cart, help with cart-related questions
 
 **Smart Responses**: 
 - NEVER give direct product lists or prices without context
 - Guide customers to explore the website themselves
 - Ask them to click on products and tell you the name
 - Then provide detailed information about that specific product
 
 **When you can't answer**:
 - Politely explain why you can't provide direct information
 - Guide them to explore the website
 - Provide contact information (email: support@nexusshop.com, WhatsApp: +8801234567890)
 - Ask them to contact directly for specific queries
 
 **Product Information**:
 - Don't list all products at once
 - Ask customers to browse and select specific products
 - Provide detailed info only when they mention a specific product name
 - Include price, features, availability, and recommendations
 
 **Customer Service**:
 - Be helpful but guide them to self-service
 - For complex queries, suggest direct contact
 - Always maintain a friendly and professional tone
 
 **Example Response**: "আপনি আমাদের ওয়েবসাইটে যে কোন প্রোডাক্ট ক্লিক করে দেখতে পারেন। আপনি কোন প্রোডাক্টের নাম বলুন, আমি আপনাকে বিস্তারিত তথ্য দিতে পারব।"`,
          autoResponseDelay: 1000,
          workingHours: {
            monday: { start: "09:00", end: "18:00", isWorking: true },
            tuesday: { start: "09:00", end: "18:00", isWorking: true },
            wednesday: { start: "09:00", end: "18:00", isWorking: true },
            thursday: { start: "09:00", end: "18:00", isWorking: true },
            friday: { start: "09:00", end: "18:00", isWorking: true },
            saturday: { start: "09:00", end: "18:00", isWorking: true },
            sunday: { start: "09:00", end: "18:00", isWorking: false }
          },
          offlineMessage: "আমরা এখন অফলাইনে আছি। আপনার মেসেজ রেখে দিন, আমরা শীঘ্রই যোগাযোগ করব।",
          openaiApiKey: null,
          contactEmail: "support@nexusshop.com",
          contactWhatsApp: "+8801234567890",
          contactWebsite: "https://nexusshop.com"
        }
      });
      
      return NextResponse.json({ success: true, settings: defaultSettings });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Chat Settings GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      isEnabled, 
      welcomeMessage, 
      aiModel, 
      maxTokens, 
      temperature, 
      systemPrompt, 
      autoResponseDelay, 
      workingHours, 
      offlineMessage,
      openaiApiKey,
      contactEmail,
      contactWhatsApp,
      contactWebsite
    } = body;

    const settings = await prisma.chatBotSetting.upsert({
      where: { id: 1 },
      update: {
        isEnabled,
        welcomeMessage,
        aiModel,
        maxTokens,
        temperature,
        systemPrompt,
        autoResponseDelay,
        workingHours,
        offlineMessage,
        openaiApiKey,
        contactEmail,
        contactWhatsApp,
        contactWebsite,
        updatedAt: new Date()
      },
      create: {
        isEnabled: true,
        welcomeMessage: welcomeMessage || "স্বাগতম! আমি আপনার সাহায্য করতে পারি।",
        aiModel: aiModel || "gpt-4o-mini",
        maxTokens: maxTokens || 1000,
        temperature: temperature || 0.7,
        systemPrompt: systemPrompt || "You are a helpful AI assistant for an e-commerce website. Respond in Bengali (Bangla) language. Help customers with product information, orders, and general queries.",
        autoResponseDelay: autoResponseDelay || 1000,
        workingHours: workingHours || {},
        offlineMessage: offlineMessage || "আমরা এখন অফলাইনে আছি। আপনার মেসেজ রেখে দিন, আমরা শীঘ্রই যোগাযোগ করব।",
        openaiApiKey: openaiApiKey || null,
        contactEmail: contactEmail || "support@nexusshop.com",
        contactWhatsApp: contactWhatsApp || "+8801234567890",
        contactWebsite: contactWebsite || "https://nexusshop.com"
      }
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Chat Settings PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat settings' },
      { status: 500 }
    );
  }
}
