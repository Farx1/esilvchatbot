import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

// Force Node.js runtime (required for pdf-parse and mammoth)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to parse PDF
async function parsePDF(buffer: ArrayBuffer): Promise<string> {
  try {
    console.log('🔍 Starting PDF parse, buffer size:', buffer.byteLength)
    const uint8Array = new Uint8Array(buffer)
    const data = await pdf(uint8Array)
    console.log('✅ PDF parsed successfully, text length:', data.text?.length || 0)
    
    if (!data.text || data.text.length === 0) {
      throw new Error('PDF parsing returned empty text')
    }
    
    return data.text
  } catch (error) {
    console.error('❌ PDF parsing error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
  console.log('📤 Upload API called')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    console.log('📄 File received:', file?.name, 'Size:', file?.size)
    
    if (!file) {
      console.error('❌ No file provided')
      return NextResponse.json(
        { error: 'No file provided', success: false },
        { status: 400 }
      )
    }

    // Validate file type and size
    const fileExtension = file.name.toLowerCase().match(/\.(pdf|docx|txt|md)$/)?.[1]
    const maxSize = 50 * 1024 * 1024 // 50MB (augmenté pour supporter les gros PDFs comme les plaquettes)

    console.log('🔍 File extension:', fileExtension, 'Max size:', maxSize)

    if (!fileExtension) {
      console.error('❌ Invalid file type:', file.name)
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOCX, TXT, and MD files are allowed.', success: false },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size, 'Max:', maxSize)
      return NextResponse.json(
        { error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`, success: false },
        { status: 400 }
      )
    }

    // Read file content
    console.log('📥 Reading file buffer...')
    const buffer = await file.arrayBuffer()
    let content = ''

    // Parse according to file extension
    console.log(`🔧 Parsing file as ${fileExtension}...`)
    try {
      switch (`.${fileExtension}`) {
        case '.pdf':
          console.log('📕 Parsing PDF...')
          content = await parsePDF(buffer)
          console.log('✅ PDF parsed, length:', content.length)
          break
        case '.docx':
          console.log('📘 Parsing DOCX...')
          content = await parseDocx(buffer)
          console.log('✅ DOCX parsed, length:', content.length)
          break
        case '.txt':
        case '.md':
          console.log('📄 Reading text file...')
          const decoder = new TextDecoder('utf-8')
          content = decoder.decode(buffer)
          console.log('✅ Text file read, length:', content.length)
          break
        default:
          console.error('❌ Unsupported file type:', fileExtension)
          return NextResponse.json(
            { error: 'Unsupported file type', success: false },
            { status: 400 }
          )
      }
    } catch (parseError) {
      console.error('❌ Parsing error:', parseError)
      return NextResponse.json(
        { 
          error: `Failed to parse ${fileExtension.toUpperCase()} file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          success: false,
          details: String(parseError)
        },
        { status: 500 }
      )
    }

    if (!content || content.trim().length < 50) {
      console.error('❌ Content too short or empty:', content.length)
      return NextResponse.json(
        { error: 'Document appears to be empty or too short', success: false },
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
    console.error('❌ File upload error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    // Return proper JSON even on error
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: String(error) 
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
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
