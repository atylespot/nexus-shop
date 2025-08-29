import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
         const { message, sessionId, customerInfo, messageType = 'text', pageContext } = body;

    // Debug: Check environment variables
    console.log('🔍 Environment Check:');
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create or get chat session
    let chatSession = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          sessionId: sessionId || `session_${Date.now()}`,
          customerName: customerInfo?.name,
          customerPhone: customerInfo?.phone,
          customerEmail: customerInfo?.email,
          metadata: customerInfo || {}
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      });
    }

    // Save customer message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: message,
        messageType,
        senderType: 'customer',
        senderName: customerInfo?.name || 'Customer'
      }
    });

    // Get chat bot settings
    const botSettings = await prisma.chatBotSetting.findFirst();
    const systemPrompt = botSettings?.systemPrompt || 
      "You are a helpful AI assistant for an e-commerce website. Respond in Bengali (Bangla) language. Help customers with product information, orders, and general queries.";

    // Check if API key is configured
    if (!botSettings?.openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please configure it in Admin Panel → AI Chat → Settings.'
      }, { status: 400 });
    }

         // Prepare context for AI
     const context = await prepareAIContext(message, chatSession, pageContext);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context, systemPrompt, botSettings.openaiApiKey);

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: aiResponse,
        messageType: 'text',
        senderType: 'ai',
        senderName: 'AI Assistant'
      }
    });

    // Update session
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sessionId: chatSession.sessionId
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const chatSession = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: { 
        messages: { 
          orderBy: { createdAt: 'asc' },
          take: 50 // Limit to last 50 messages
        } 
      }
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: chatSession
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    );
  }
}

async function prepareAIContext(message: string, chatSession: any, pageContext?: string) {
  const context: any = {
    websiteInfo: {
      name: "Nexus Shop",
      type: "E-commerce",
      currency: "BDT",
      contact: {
        email: "support@nexusshop.com",
        whatsapp: "+8801234567890",
        website: "https://nexusshop.com"
      }
    },
    pageContext: pageContext || 'unknown',
    recentMessages: chatSession.messages.slice(-5).map((msg: any) => ({
      role: msg.senderType === 'customer' ? 'user' : 'assistant',
      content: msg.content
    })),
    smartGuidance: {
      productExploration: "আপনি আমাদের ওয়েবসাইটে যে কোন প্রোডাক্ট ক্লিক করে দেখতে পারেন। আপনি কোন প্রোডাক্টের নাম বলুন, আমি আপনাকে বিস্তারিত তথ্য দিতে পারব।",
      contactInfo: "আপনার কাঙ্ক্ষিত উত্তর না পেলে, সরাসরি যোগাযোগ করুন: ইমেইল: support@nexusshop.com, WhatsApp: +8801234567890",
      selfService: "আপনি আমাদের ওয়েবসাইটে নিজেই প্রোডাক্ট দেখতে পারেন এবং আপনার পছন্দের আইটেম নির্বাচন করতে পারেন।"
    }
  };

  // Check if customer is asking for general product information (not specific)
  const isGeneralProductQuery = (
    message.toLowerCase().includes('product') || 
    message.toLowerCase().includes('price') || 
    message.toLowerCase().includes('cost') ||
    message.toLowerCase().includes('দাম') ||
    message.toLowerCase().includes('প্রোডাক্ট') ||
    message.toLowerCase().includes('কি কি') ||
    message.toLowerCase().includes('সব') ||
    message.toLowerCase().includes('লিস্ট')
  ) && !message.toLowerCase().includes('specific') && !message.toLowerCase().includes('নির্দিষ্ট');

  if (isGeneralProductQuery) {
    // Don't provide product list, instead guide them
    context.guidance = "general_product_query";
    context.message = "Customer is asking for general product information. Guide them to explore the website and ask for specific product names.";
  }

  // Only provide product info if customer mentions a specific product
  const specificProductMatch = message.match(/(?:প্রোডাক্ট|product|item|আইটেম)\s+(?:নাম|name)?\s*[:\-]?\s*([^\s,।]+)/i);
  if (specificProductMatch) {
    const productName = specificProductMatch[1];
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: productName, mode: 'insensitive' } },
          { description: { contains: productName, mode: 'insensitive' } }
        ]
      },
      take: 5,
      include: {
        category: true,
        inventory: true,
        images: { take: 1 }
      }
    });

    if (products.length > 0) {
      context.specificProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.regularPrice,
        salePrice: p.salePrice,
        currency: p.currency,
        category: p.category.name,
        stock: p.inventory?.quantity || 0,
        image: p.images[0]?.url,
        description: p.description
      }));
    }
  }

  // Add order information if customer is asking about orders
  if (message.toLowerCase().includes('order') || 
      message.toLowerCase().includes('অর্ডার') ||
      message.toLowerCase().includes('track')) {
    
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    context.recentOrders = orders;
  }

  return context;
}

async function generateAIResponse(message: string, context: any, systemPrompt: string, apiKey: string) {
  try {
    // Check if OpenAI API key is provided
    if (!apiKey) {
      console.log('❌ OpenAI API key not provided');
      return 'দুঃখিত, AI সিস্টেম এখন কনফিগার করা হয়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।';
    }

    console.log('✅ OpenAI API key found, proceeding with AI generation');

    // Create smart context-aware messages
    let smartPrompt = systemPrompt;
    
    // Add context-specific guidance
    if (context.guidance === "general_product_query") {
      smartPrompt += `\n\nIMPORTANT: Customer is asking for general product information. DO NOT provide product lists. Instead:
      1. Guide them to explore the website
      2. Ask them to click on products and tell you the name
      3. Provide contact information for direct queries
      4. Be helpful but encourage self-service`;
    }
    
    if (context.specificProducts && context.specificProducts.length > 0) {
      smartPrompt += `\n\nCustomer mentioned specific product(s). Provide detailed information about: ${context.specificProducts.map(p => p.name).join(', ')}`;
    }

    const messages = [
      { role: 'system', content: smartPrompt },
      ...context.recentMessages,
      { role: 'user', content: message }
    ];

    console.log('🤖 Sending request to OpenAI with messages:', messages.length);

    // Create OpenAI client with provided API key
    const openaiClient = new OpenAI({ 
      apiKey: apiKey, 
      dangerouslyAllowBrowser: false 
    });

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = response.choices[0]?.message?.content?.trim();
    console.log('✅ AI response generated successfully:', aiResponse?.substring(0, 100) + '...');

    return aiResponse || 'দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।';

  } catch (error: any) {
    console.error('OpenAI Error:', error);
    
    // Check for specific error types
    if (error.code === 'invalid_api_key' || error.status === 401) {
      console.log('❌ Invalid API key or unauthorized');
      return 'দুঃখিত, AI সিস্টেম এখন কনফিগার করা হয়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।';
    } else if (error.status === 429) {
      console.log('❌ Rate limit exceeded');
      return 'দুঃখিত, AI সিস্টেম এখন ব্যস্ত। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
    } else if (error.status >= 500) {
      console.log('❌ OpenAI server error');
      return 'দুঃখিত, AI সিস্টেমে একটি সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।';
    }
    
    console.log('❌ Unknown error:', error.message);
    return 'দুঃখিত, একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
}
