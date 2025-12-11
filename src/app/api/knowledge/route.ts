import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: string
  confidence: number
  createdAt: string
  updatedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let items

    if (search) {
      // Case-insensitive search
      const allItems = await db.knowledgeBase.findMany({
        orderBy: { createdAt: 'desc' }
      })
      
      const searchLower = search.toLowerCase()
      items = allItems.filter(item => 
        item.question.toLowerCase().includes(searchLower) ||
        item.answer.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      )
    } else {
      items = await db.knowledgeBase.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit for performance
      })
    }

    console.log(`📚 Knowledge API: Returning ${items.length} entries`)

    return NextResponse.json({
      success: true,
      items: items,
      entries: items, // For compatibility with RAG viewer
      total: items.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching knowledge items:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { item } = body
        const newItem = await db.knowledgeBase.create({
          data: {
            id: Date.now().toString(),
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ success: true, item: newItem })
      }

      case 'update': {
        const { item } = body
        const { id } = item
        
        const updatedItem = await db.knowledgeBase.update({
          where: { id },
          data: {
            ...item,
            updatedAt: new Date()
          }
        })
        return NextResponse.json({ success: true, item: updatedItem })
      }

      case 'delete': {
        const { id } = body
        
        await db.knowledgeBase.delete({
          where: { id }
        })
        return NextResponse.json({ success: true })
      }

      case 'bulk_create': {
        const { items } = body
        const newItems = items.map((item: any) => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
        
        await db.knowledgeBase.createMany({
          data: newItems
        })
        
        return NextResponse.json({ 
          success: true, 
          count: newItems.length 
        })
      }

      case 'bulk_update': {
        const { items } = body
        const updatePromises = items.map((item: any) =>
          db.knowledgeBase.update({
            where: { id: item.id },
            data: {
              ...item,
              updatedAt: new Date()
            }
          })
        )
        
        await Promise.all(updatePromises)
        
        return NextResponse.json({ 
          success: true, 
          count: items.length 
        })
      }

      case 'bulk_delete': {
        const { ids } = body
        
        await db.knowledgeBase.deleteMany({
          where: { id: { in: ids } }
        })
        
        return NextResponse.json({ 
          success: true, 
          count: ids.length 
        })
      }

      case 'get_stats': {
        const stats = await db.knowledgeBase.groupBy({
          by: ['category'],
          _count: {
            id: true
          },
          _avg: {
            confidence: true
          }
        })

        const categoryStats = Object.entries(stats).map(([category, stats]) => ({
          category,
          count: stats._count,
          avgConfidence: stats._avg
        }))

        return NextResponse.json({
          success: true,
          stats: categoryStats
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Knowledge management error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}