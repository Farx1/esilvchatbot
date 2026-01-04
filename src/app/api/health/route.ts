import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down'
  services: {
    ollama: { status: 'up' | 'down', latency?: number, error?: string }
    gemini: { status: 'configured' | 'missing' }
    database: { status: 'up' | 'down', latency?: number, error?: string }
  }
  timestamp: string
}

async function checkOllama(): Promise<{ status: 'up' | 'down', latency?: number, error?: string }> {
  try {
    const startTime = Date.now()
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    const latency = Date.now() - startTime
    
    if (response.ok) {
      return { status: 'up', latency }
    } else {
      return { status: 'down', error: `HTTP ${response.status}` }
    }
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Connection failed' 
    }
  }
}

function checkGemini(): { status: 'configured' | 'missing' } {
  const geminiKey = process.env.GEMINI_API_KEY
  return { 
    status: geminiKey && geminiKey.length > 0 ? 'configured' : 'missing' 
  }
}

async function checkDatabase(): Promise<{ status: 'up' | 'down', latency?: number, error?: string }> {
  try {
    const startTime = Date.now()
    // Simple query to test database connectivity
    await db.knowledgeBase.count()
    const latency = Date.now() - startTime
    
    return { status: 'up', latency }
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Database connection failed' 
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🏥 Running health check...')
    
    // Run all checks in parallel
    const [ollamaResult, geminiResult, databaseResult] = await Promise.all([
      checkOllama(),
      Promise.resolve(checkGemini()),
      checkDatabase()
    ])

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
    
    // Critical services: database must be up
    if (databaseResult.status === 'down') {
      overallStatus = 'down'
    }
    // Degraded if Ollama is down (but Gemini might still work)
    else if (ollamaResult.status === 'down') {
      overallStatus = 'degraded'
    }
    // Degraded if Gemini is not configured (but Ollama might still work)
    else if (geminiResult.status === 'missing') {
      overallStatus = 'degraded'
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      services: {
        ollama: ollamaResult,
        gemini: geminiResult,
        database: databaseResult
      },
      timestamp: new Date().toISOString()
    }

    console.log(`🏥 Health check result: ${overallStatus}`, {
      ollama: ollamaResult.status,
      database: databaseResult.status,
      gemini: geminiResult.status
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Health check error:', error)
    return NextResponse.json(
      {
        status: 'down',
        services: {
          ollama: { status: 'down', error: 'unknown' },
          gemini: { status: 'missing' },
          database: { status: 'down', error: 'unknown' }
        },
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      } as HealthCheckResult,
      { status: 500 }
    )
  }
}

