import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get recent conversations with all messages
    const conversations = await db.conversation.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            agentType: true,
            timestamp: true,
            feedback: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    console.log(`📊 Conversations API: Returning ${conversations.length} conversations`)

    return NextResponse.json({ 
      success: true,
      conversations,
      total: conversations.length
    })
  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}