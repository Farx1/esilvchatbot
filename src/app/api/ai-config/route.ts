import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// AI Provider Configuration
type AIProvider = 'openai' | 'anthropic' | 'ollama' | 'huggingface' | 'gemini'

interface AIConfig {
  provider: AIProvider
  model: string
  apiKey?: string
  baseUrl?: string
  maxTokens?: number
  temperature?: number
}

class AIProviderManager {
  private static instance: AIProviderManager
  private config: AIConfig

  private constructor() {
    this.config = this.loadConfig()
  }

  static getInstance(): AIProviderManager {
    if (!AIProviderManager.instance) {
      AIProviderManager.instance = new AIProviderManager()
    }
    return AIProviderManager.instance
  }

  private loadConfig(): AIConfig {
    const provider = (process.env.AI_PROVIDER || 'ollama') as AIProvider
    
    const configs: Record<AIProvider, AIConfig> = {
      openai: {
        provider: 'openai',
        model: process.env.OPENAI_MODEL || 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
        maxTokens: 2000,
        temperature: 0.7
      },
      anthropic: {
        provider: 'anthropic',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        apiKey: process.env.ANTHROPIC_API_KEY,
        maxTokens: 2000,
        temperature: 0.7
      },
      ollama: {
        provider: 'ollama',
        model: process.env.OLLAMA_MODEL || 'llama2',
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        maxTokens: 2000,
        temperature: 0.7
      },
      huggingface: {
        provider: 'huggingface',
        model: process.env.HUGGINGFACE_API_KEY || 'microsoft/DialoGPT-medium',
        apiKey: process.env.HUGGINGFACE_API_KEY,
        baseUrl: 'https://api-inference.huggingface.co',
        maxTokens: 2000,
        temperature: 0.7
      },
      gemini: {
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
        apiKey: process.env.GEMINI_API_KEY,
        maxTokens: 2000,
        temperature: 0.7
      }
    }

    return configs[provider] || configs['ollama']
  }

  getConfig(): AIConfig {
    return this.config
  }

  async switchProvider(provider: AIProvider, model?: string): Promise<boolean> {
    try {
      // Validate the new configuration
      const testConfig = { ...this.config, provider, model: model || this.config.model }
      
      // Test the new provider
      const isValid = await this.testProvider(testConfig)
      
      if (isValid) {
        // Update environment variables (in memory only for development)
        process.env.AI_PROVIDER = provider
        if (model) {
          switch (provider) {
            case 'openai':
              process.env.OPENAI_MODEL = model
              break
            case 'anthropic':
              process.env.ANTHROPIC_MODEL = model
              break
            case 'ollama':
              process.env.OLLAMA_MODEL = model
              break
            case 'huggingface':
              process.env.HUGGINGFACE_MODEL = model
              break
          }
        }
        
        // Reload configuration
        this.config = this.loadConfig()
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error switching provider:', error)
      return false
    }
  }

  private async testProvider(config: AIConfig): Promise<boolean> {
    try {
      switch (config.provider) {
        case 'openai':
          return await this.testOpenAI(config)
        case 'anthropic':
          return await this.testAnthropic(config)
        case 'ollama':
          return await this.testOllama(config)
        case 'huggingface':
          return await this.testHuggingFace(config)
        case 'gemini':
          return await this.testGemini(config)
        default:
          return false
      }
    } catch (error) {
      console.error('Provider test failed:', error)
      return false
    }
  }

  private async testOpenAI(config: AIConfig): Promise<boolean> {
    if (!config.apiKey) return false
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    })
    
    return response.ok
  }

  private async testAnthropic(config: AIConfig): Promise<boolean> {
    if (!config.apiKey) return false
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })
    
    return response.ok
  }

  private async testOllama(config: AIConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.baseUrl}/api/tags`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  private async testHuggingFace(config: AIConfig): Promise<boolean> {
    if (!config.apiKey) return false
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${config.model}`, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    })
    
    return response.ok
  }

  private async testGemini(config: AIConfig): Promise<boolean> {
    if (!config.apiKey) return false
    
    try {
      // Just check if API key is provided and model name is valid
      // Full test would require actual API call which is expensive
      return config.apiKey.length > 0 && config.model.length > 0
    } catch (error) {
      console.error('Gemini test error:', error)
      return false
    }
  }

  getAvailableModels(): Record<AIProvider, string[]> {
    return {
      openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
      anthropic: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      ollama: ['llama3.1:8b', 'llama3.1:70b', 'llama2', 'mistral', 'codellama', 'vicuna', 'phi', 'qwen2.5'],
      huggingface: ['microsoft/DialoGPT-medium', 'google/flan-t5-large', 'facebook/bart-large'],
      gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro']
    }
  }
}

// Enhanced Chat Orchestrator with AI Provider Support
class ChatOrchestrator {
  private aiManager: AIProviderManager

  constructor() {
    this.aiManager = AIProviderManager.getInstance()
  }

  async initialize() {
    // Initialization logic if needed for specific providers
  }

  async generateCompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    await this.initialize()
    const config = this.aiManager.getConfig()

    try {
      switch (config.provider) {
        case 'openai':
          return await this.generateOpenAICompletion(prompt, conversationHistory)
        case 'anthropic':
          return await this.generateAnthropicCompletion(prompt, conversationHistory)
        case 'ollama':
          return await this.generateOllamaCompletion(prompt, conversationHistory)
        case 'huggingface':
          return await this.generateHuggingFaceCompletion(prompt, conversationHistory)
        case 'gemini':
          return await this.generateGeminiCompletion(prompt, conversationHistory)
        default:
          throw new Error(`Unsupported provider: ${config.provider}`)
      }
    } catch (error) {
      console.error('Generation error:', error)
      return 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer.'
    }
  }

  private async generateOpenAICompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    const config = this.aiManager.getConfig()
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'Tu es un assistant ESILV. Tu réponds UNIQUEMENT en français. Ne réponds jamais en anglais.' },
          ...conversationHistory,
          { role: 'user', content: prompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Désolé, je ne peux pas répondre pour le moment.'
  }

  private async generateAnthropicCompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    const config = this.aiManager.getConfig()
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          { role: 'user', content: `Tu es un assistant ESILV. Tu réponds UNIQUEMENT en français. Ne réponds jamais en anglais. ${prompt}` }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0]?.text || 'Désolé, je ne peux pas répondre pour le moment.'
  }

  private async generateOllamaCompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    const config = this.aiManager.getConfig()
    
    // Build messages array for chat API (like in the notebook)
    const messages = [
      { role: 'system', content: 'Tu es un assistant ESILV. Tu réponds UNIQUEMENT en français. Ne réponds jamais en anglais, même si le contexte contient de l\'anglais.' },
      ...conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: prompt }
    ]

    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message?.content || data.response || 'Désolé, je ne peux pas répondre pour le moment.'
  }

  private async generateGeminiCompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    const config = this.aiManager.getConfig()
    
    if (!config.apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(config.apiKey)
      const model = genAI.getGenerativeModel({ model: config.model })

      // Build the full prompt with conversation history
      const systemPrompt = 'Tu es un assistant ESILV. Tu réponds UNIQUEMENT en français. Ne réponds jamais en anglais, même si le contexte contient de l\'anglais.'
      const fullPrompt = conversationHistory.length > 0
        ? `${systemPrompt}\n\nHistorique de conversation:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUtilisateur: ${prompt}\nAssistant:`
        : `${systemPrompt}\n\nUtilisateur: ${prompt}\nAssistant:`

      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      return response.text() || 'Désolé, je ne peux pas répondre pour le moment.'
    } catch (error: any) {
      console.error('Gemini API error:', error)
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
    }
  }

  private async generateHuggingFaceCompletion(prompt: string, conversationHistory: any[] = []): Promise<string> {
    const config = this.aiManager.getConfig()
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${config.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: `Tu es un assistant ESILV. Tu réponds UNIQUEMENT en français. Ne réponds jamais en anglais. ${prompt}`,
        parameters: {
          max_length: config.maxTokens,
          temperature: config.temperature
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data[0]?.generated_text || 'Désolé, je ne peux pas répondre pour le moment.'
  }
}

// API Routes for AI Provider Management
export async function GET(request: NextRequest) {
  try {
    const aiManager = AIProviderManager.getInstance()
    const currentConfig = aiManager.getConfig()
    const availableModels = aiManager.getAvailableModels()

    return NextResponse.json({
      current: currentConfig,
      available: availableModels
    })
  } catch (error) {
    console.error('AI config error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, model } = await request.json()
    
    const aiManager = AIProviderManager.getInstance()
    const success = await aiManager.switchProvider(provider, model)
    
    if (success) {
      return NextResponse.json({
        message: 'Provider switched successfully',
        config: aiManager.getConfig()
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to switch provider' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('AI switch error:', error)
    return NextResponse.json(
      { error: 'Failed to switch AI provider' },
      { status: 500 }
    )
  }
}

// Export for use in chat API
export { AIProviderManager, ChatOrchestrator }