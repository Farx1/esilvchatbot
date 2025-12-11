import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { messageId, feedback } = await request.json()

    if (!messageId || !feedback) {
      return NextResponse.json(
        { error: 'Missing messageId or feedback' },
        { status: 400 }
      )
    }

    // Map 'up'/'down' to 'positive'/'negative'
    const feedbackValue = feedback === 'up' ? 'positive' : feedback === 'down' ? 'negative' : 'neutral'

    // Update the message with feedback
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { feedback: feedbackValue }
    })

    console.log(`✅ Feedback enregistré: ${messageId} -> ${feedbackValue}`)

    return NextResponse.json({ 
      success: true, 
      message: updatedMessage 
    })
  } catch (error) {
    console.error('Feedback API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
