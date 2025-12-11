import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get recent conversations with message count and last message
    const conversations = await db.conversation.findMany({
      include: {
        user: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })

    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      user: conv.user,
      messageCount: conv._count?.messages || 0,
      lastMessage: conv.messages[0]?.content || 'No messages',
      timestamp: conv.updatedAt.toISOString()
    }))

    return NextResponse.json({ conversations: formattedConversations })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}