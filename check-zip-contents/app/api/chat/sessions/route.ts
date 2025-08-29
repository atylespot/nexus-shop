import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Chat Sessions API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, status } = body;

    if (!sessionId || !status) {
      return NextResponse.json({ error: 'Session ID and status are required' }, { status: 400 });
    }

    const updatedSession = await prisma.chatSession.update({
      where: { sessionId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error('Chat Sessions Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

