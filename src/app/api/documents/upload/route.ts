import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

// Helper function to parse PDF
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  try {
    const uint8Array = new Uint8Array(buffer)
    const data = await pdf(uint8Array)
    return data.text
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF')
  }
}

// Helper function to parse DOCX
async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: buffer })
    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX')
  }
}

// Helper function to chunk text intelligently
function chunkText(text: string, maxChunkSize: number = 1500): string[] {
  const chunks: string[] = []
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()
    
    if (!trimmedParagraph) continue
    
    // If adding this paragraph would exceed max size, save current chunk and start new one
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = trimmedParagraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph
    }
  }
  
  // Add remaining chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Helper function to generate a question from chunk using simple heuristics
function generateQuestionFromChunk(chunk: string, filename: string, index: number): string {
  // Extract first meaningful sentence or use filename
  const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 20)
  
  if (sentences.length > 0) {
    const firstSentence = sentences[0].trim().substring(0, 150)
    return `${firstSentence}... (Document: ${filename}, partie ${index + 1})`
  }
  
  return `Contenu du document ${filename} - partie ${index + 1}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const fileExtension = file.name.toLowerCase().match(/\.(pdf|docx|txt|md)$/)?.[1]
    const maxSize = 50 * 1024 * 1024 // 50MB (augmenté pour supporter les gros PDFs comme les plaquettes)

    if (!fileExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.` },
        { status: 400 }
      )
    }

    // Read file content
    const buffer = await file.arrayBuffer()
    let content = ''

    // Parse according to file extension
    switch (`.${fileExtension}`) {
      case '.pdf':
        content = await parsePDF(buffer)
        break
      case '.docx':
        content = await parseDocx(buffer)
        break
      case '.txt':
      case '.md':
        const decoder = new TextDecoder('utf-8')
        content = decoder.decode(buffer)
        break
      default:
        return NextResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        )
    }

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Document appears to be empty or too short' },
        { status: 400 }
      )
    }

    // Chunk the text
    const chunks = chunkText(content)
    console.log(`📄 Document "${file.name}" parsed: ${content.length} chars, ${chunks.length} chunks`)

    // Save each chunk to KnowledgeBase
    const savedChunks = []
    const uploadedAt = new Date()

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const question = generateQuestionFromChunk(chunk, file.name, i)
      
      const knowledgeEntry = await db.knowledgeBase.create({
        data: {
          question: question,
          answer: chunk,
          category: 'documents_uploadés',
          confidence: 0.85,
          source: `upload:${file.name}`,
          documentName: file.name,
          documentType: fileExtension,
          uploadedAt: uploadedAt,
          chunkIndex: i,
          lastVerified: uploadedAt
        }
      })
      
      savedChunks.push(knowledgeEntry.id)
    }

    // Also save to Document table for tracking
    await db.document.create({
      data: {
        title: file.name,
        content: content.substring(0, 10000), // Store first 10k characters for reference
        source: `upload:${file.name}`,
        type: fileExtension,
        metadata: JSON.stringify({
          originalName: file.name,
          size: file.size,
          chunks: chunks.length,
          uploadedAt: uploadedAt.toISOString(),
          knowledgeEntryIds: savedChunks
        })
      }
    })

    console.log(`✅ Document "${file.name}" added to RAG: ${savedChunks.length} entries created`)

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
      knowledgeEntries: savedChunks.length,
      message: `Document uploaded and processed successfully. ${chunks.length} chunk(s) added to knowledge base.`
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const documents = await db.document.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        source: doc.source,
        createdAt: doc.createdAt,
        metadata: JSON.parse(doc.metadata || '{}')
      }))
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
