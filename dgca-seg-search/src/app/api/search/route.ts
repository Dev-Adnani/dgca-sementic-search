import { NextRequest, NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

// Initialize clients (server-side only)
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dgca-reports'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Generate embedding for query
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
      encoding_format: 'float',
    })

    const queryEmbedding = response.data[0].embedding

    // Build filter based on category
    const filter: Record<string, any> = {}
    if (category && category !== 'all') {
      filter.category = { $eq: category.toUpperCase() }
    }

    // Search Pinecone
    const index = pinecone.index(INDEX_NAME)
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: limit,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    })

    // Transform results with defensive checks
    const results =
      searchResults.matches?.map((match) => {
        console.log('Processing match:', match.metadata) // Debug log
        return {
          file_name: match.metadata?.filename || 'Unknown File',
          chunk_id: Number(match.metadata?.chunk_index) || 0,
          content: match.metadata?.text || 'No content available',
          score: match.score || 0,
          category:
            (match.metadata?.category as 'INCIDENT' | 'ACCIDENT') || 'INCIDENT',
        }
      }) || []

    const searchTime = (Date.now() - startTime) / 1000

    return NextResponse.json({
      results,
      query,
      total_results: results.length,
      search_time: searchTime,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
