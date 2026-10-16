import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// No real DB, no network, no LLM call: Prisma, the scraper and the provider orchestrator are mocked.
// /api/knowledge and /api/rag-updates run for real (in-process) on the mocked Prisma.
const { db, generateCompletion, scraperPOST } = vi.hoisted(() => ({
  db: {
    knowledgeBase: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), createMany: vi.fn(), deleteMany: vi.fn() },
    rAGUpdate: { create: vi.fn() },
    conversation: { findFirst: vi.fn(), create: vi.fn() },
    message: { create: vi.fn() },
  },
  generateCompletion: vi.fn(),
  scraperPOST: vi.fn(),
}))
vi.mock('@/lib/db', () => ({ db }))
vi.mock('@/app/api/ai-config/route', () => ({
  ChatOrchestrator: class { generateCompletion = generateCompletion },
}))
vi.mock('@/app/api/scraper/route', () => ({ POST: scraperPOST }))

import { POST } from './route'

const chat = async (message: string, conversationHistory: unknown[] = []) => {
  const res = await POST(new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversationHistory }),
  }))
  return res.json()
}

const kb = (question: string, answer: string, category = 'general') =>
  ({ question, answer, category, confidence: 0.8, createdAt: new Date(), lastVerified: new Date() })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  scraperPOST.mockResolvedValue(Response.json({ results: [] }))
  generateCompletion.mockResolvedValue('ok')
  db.knowledgeBase.findMany.mockResolvedValue([])
  db.knowledgeBase.findFirst.mockResolvedValue(null)
  db.rAGUpdate.create.mockResolvedValue({ id: 'u1' })
  db.conversation.findFirst.mockResolvedValue({ id: 'c1' })
  db.message.create.mockImplementation(async ({ data }) => ({ id: data.id ?? 'm1' }))
})

describe('POST /api/chat intent routing', () => {
  it.each([
    ['Quels sont les frais de scolarité ?', 'retrieval'],
    ["Quels sont les frais d'inscription ?", 'retrieval'], // knowledge wins over form intent
    ["C'est où l'ÉCOLE ?", 'retrieval'], // accents + case
    ['Je voudrais postuler', 'form_filling'],
    ['Voici mon téléphone', 'form_filling'],
    ['Mon prenom est Jules', 'form_filling'], // accent-insensitive
    ["Quel est le nombre d'étudiants ?", 'orchestration'], // "nombre" must not match "nom"
    ['Bonjour', 'orchestration'],
  ])('%s -> %s', async (message, agentType) => {
    expect((await chat(message)).agentType).toBe(agentType)
  })

  it('treats a follow-up without keywords as retrieval', async () => {
    const history = [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }]
    expect((await chat('et ensuite ?', history)).agentType).toBe('retrieval')
  })

  it('rejects an empty message', async () => {
    const res = await POST(new NextRequest('http://localhost/api/chat', { method: 'POST', body: '{}' }))
    expect(res.status).toBe(400)
  })
})

describe('RAG keyword search', () => {
  it('queries by extracted keywords, ranks by relevance and keeps the top 5', async () => {
    db.knowledgeBase.findMany.mockResolvedValue([
      kb('Horaires de la bibliothèque', 'Ouverte de 8h à 20h'),
      kb('Transport', 'Les frais de transport sont remboursés à 50%'),
      kb('Logement', 'Résidences proches'),
      kb('Associations', 'Plus de 50 associations'),
      kb('Campus', 'La Défense'),
      kb('Quels sont les frais de scolarité ?', '9 500 € par an', 'frais'),
    ])

    const body = await chat('Quels sont les frais de scolarité ?')

    const { where } = db.knowledgeBase.findMany.mock.calls[0][0]
    expect(where.OR).toContainEqual({ question: { contains: 'frais' } })
    expect(where.OR).toContainEqual({ question: { contains: 'scolarite' } }) // de-accented variant
    expect(where.OR).not.toContainEqual({ question: { contains: 'sont' } }) // stop word

    expect(body.agentType).toBe('retrieval')
    expect(body.ragSources).toHaveLength(5)
    expect(body.ragSources[0].question).toBe('Quels sont les frais de scolarité ?')
    expect(body.ragSources[1].question).toBe('Transport')
    expect(generateCompletion.mock.calls[0][0]).toContain('R: 9 500 € par an')
    expect(scraperPOST).not.toHaveBeenCalled() // fresh RAG data: no scraper call
  })

  // Known bug: an empty search returns the non-empty "Aucune information..." text, so the
  // "fallback (RAG vide)" branch in handleRetrieval never runs. Drop `.fails` once fixed.
  it.fails('falls back to the scraper when the knowledge base has nothing', async () => {
    const body = await chat('Quels sont les frais de scolarité ?')
    expect(scraperPOST).toHaveBeenCalled()
    expect(body.ragSources).toEqual([])
  })

  it('replaces a stale contact entry when the web disagrees, without any HTTP call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600 * 1000)
    db.knowledgeBase.findMany.mockResolvedValue([{
      ...kb('Qui est le responsable des admissions ?', 'Responsable Jean Dupont, bureau des admissions ESILV'),
      id: 'old1', lastVerified: tenDaysAgo,
    }])
    scraperPOST.mockResolvedValue(Response.json({ results: [{
      title: 'Admissions', url: 'https://www.esilv.fr/admissions',
      content: 'Responsable Marie Martin, bureau des admissions ESILV',
    }] }))

    await chat('Qui est le responsable des admissions ?')

    // background verification: conflict found -> /api/knowledge bulk_delete + /api/rag-updates log
    await vi.waitFor(() => expect(db.rAGUpdate.create).toHaveBeenCalled())
    expect(db.knowledgeBase.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['old1'] } } })
    expect(db.rAGUpdate.create.mock.calls[0][0].data).toMatchObject({ updateType: 'delete', entryId: 'old1' })
    expect(db.knowledgeBase.create.mock.calls[0][0].data).toMatchObject({ source: 'https://www.esilv.fr/admissions' }) // scraped page saved
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
