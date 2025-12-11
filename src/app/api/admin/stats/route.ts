import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get dashboard statistics
    const totalUsers = await db.user.count()
    const totalConversations = await db.conversation.count()
    const totalMessages = await db.message.count()
    const totalFormSubmissions = await db.formSubmission.count()

    return NextResponse.json({
      totalUsers,
      totalConversations,
      totalMessages,
      totalFormSubmissions
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}