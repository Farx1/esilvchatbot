import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get agent usage statistics
    // If no messages exist, return empty array
    const messageCount = await db.message.count()
    
    if (messageCount === 0) {
      return NextResponse.json({ stats: [] })
    }

    const agentStats = await db.message.groupBy({
      by: ['agentType'],
      where: {
        role: 'assistant',
        agentType: {
          not: null
        }
      },
      _count: {
        agentType: true
      }
    })

    const formattedStats = agentStats.map(stat => {
      const agentNames: Record<string, string> = {
        'retrieval': 'RAG',
        'form_filling': 'Formulaire',
        'orchestration': 'Orchestration'
      }

      const colors: Record<string, string> = {
        'retrieval': '#3b82f6',
        'form_filling': '#10b981',
        'orchestration': '#8b5cf6'
      }

      return {
        name: agentNames[stat.agentType || 'unknown'] || stat.agentType || 'Unknown',
        count: stat._count.agentType,
        color: colors[stat.agentType || 'unknown'] || '#6b7280'
      }
    })

    return NextResponse.json({ stats: formattedStats })
  } catch (error: any) {
    console.error('Error fetching agent stats:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}