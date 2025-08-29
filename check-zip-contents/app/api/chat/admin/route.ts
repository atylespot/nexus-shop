import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/ai';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, senderType = 'admin' } = body;

    if (!sessionId || !message) {
      return NextResponse.json({ error: 'Session ID and message are required' }, { status: 400 });
    }

    // Get chat session
    const chatSession = await prisma.chatSession.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Save admin message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: message,
        messageType: 'text',
        senderType: 'admin',
        senderName: 'Admin'
      }
    });

    // Get chat bot settings
    const botSettings = await prisma.chatBotSetting.findFirst();
    const systemPrompt = botSettings?.systemPrompt || 
      "You are a helpful AI assistant for an e-commerce website. Respond in Bengali (Bangla) language. Help customers with product information, orders, and general queries.";

    // Prepare context for AI
    const context = await prepareAIContext(message, chatSession);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, context, systemPrompt);

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
      aiResponse,
      sessionId: chatSession.sessionId
    });

  } catch (error) {
    console.error('Admin Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process admin message' },
      { status: 500 }
    );
  }
}

async function prepareAIContext(message: string, chatSession: any) {
  const context: any = {
    websiteInfo: {
      name: "Nexus Shop",
      type: "E-commerce",
      currency: "BDT"
    },
    recentMessages: chatSession.messages.slice(-5).map((msg: any) => ({
      role: msg.senderType === 'customer' ? 'user' : 'assistant',
      content: msg.content
    }))
  };

  // Add product information if admin is asking about products
  if (message.toLowerCase().includes('product') || 
      message.toLowerCase().includes('price') || 
      message.toLowerCase().includes('cost') ||
      message.toLowerCase().includes('দাম') ||
      message.toLowerCase().includes('প্রোডাক্ট')) {
    
    const products = await prisma.product.findMany({
      take: 10,
      include: {
        category: true,
        inventory: true,
        images: { take: 1 }
      }
    });

    context.products = products.map(p => ({
      id: p.id,
      name: p.name,
      price: p.regularPrice,
      salePrice: p.salePrice,
      currency: p.currency,
      category: p.category.name,
      stock: p.inventory?.quantity || 0,
      image: p.images[0]?.url
    }));
  }

  // Add order information if admin is asking about orders
  if (message.toLowerCase().includes('order') || 
      message.toLowerCase().includes('অর্ডার') ||
      message.toLowerCase().includes('track')) {
    
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });

    context.recentOrders = orders;
  }

  // Add customer information
  if (chatSession.customerName || chatSession.customerPhone || chatSession.customerEmail) {
    context.customerInfo = {
      name: chatSession.customerName,
      phone: chatSession.customerPhone,
      email: chatSession.customerEmail
    };
  }

  return context;
}

async function generateAIResponse(message: string, context: any, systemPrompt: string) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context.recentMessages,
      { role: 'user', content: message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content?.trim() || 
      'দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।';

  } catch (error) {
    console.error('OpenAI Error:', error);
    return 'দুঃখিত, একটি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
  }
}

