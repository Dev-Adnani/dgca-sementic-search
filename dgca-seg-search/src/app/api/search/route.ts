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

/**
 * Generate a query-aware summary from search results
 */
async function generateQueryAwareSummary(
  query: string,
  matches: any[],
  topN: number = 5
): Promise<{ summary: string; summaryPoints: string[] }> {
  try {
    // Take top N results
    const topMatches = matches.slice(0, topN)
    
    // If no matches, return empty summary
    if (topMatches.length === 0) {
      return { summary: '', summaryPoints: [] }
    }
    
    // Extract unique document summaries and content snippets
    const docSummaries = new Map<string, string>()
    const contentSnippets: string[] = []
    
    topMatches.forEach((match) => {
      const metadata = match.metadata || {}
      const filename = metadata.filename || 'Unknown'
      const docSummary = metadata.doc_summary
      const content = metadata.text || ''
      
      // Collect unique document summaries
      if (docSummary && !docSummaries.has(filename)) {
        docSummaries.set(filename, docSummary)
      }
      
      // Collect content snippets (first 300 chars)
      if (content) {
        contentSnippets.push(content.substring(0, 300))
      }
    })
    
    // Combine document summaries and content
    const allSummaries = Array.from(docSummaries.values()).join('\n\n')
    const allContent = contentSnippets.join('\n\n')
    
    // Generate query-aware summary
    const summaryPrompt = `You are analyzing search results for an aviation safety query. 
Generate a concise summary with 3-6 key points that directly address the user's query.

User Query: "${query}"

Relevant Document Summaries:
${allSummaries || 'No document summaries available'}

Relevant Content Snippets:
${allContent.substring(0, 2000)}

Generate a summary with 3-6 bullet points that:
- Directly addresses the user's query: "${query}"
- Synthesizes information from the search results
- Highlights the most relevant findings, causes, or recommendations
- Each point should be concise (1-2 sentences)
- Written in clear, professional language

Format your response as a numbered list (1. 2. 3. etc.) with no additional text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at summarizing aviation safety information. Provide clear, concise summaries that directly answer user queries.',
        },
        { role: 'user', content: summaryPrompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
    })

    const summaryText = response.choices[0].message.content?.trim() || ''
    
    // Parse summary into points
    const summaryPoints: string[] = []
    const lines = summaryText.split('\n')
    
    for (const line of lines) {
      const cleaned = line.trim()
      // Remove numbering (1. 2. etc.)
      const point = cleaned.replace(/^\d+[\.\)]\s*/, '').trim()
      if (point && point.length > 20) {
        summaryPoints.push(point)
      }
    }
    
    // If parsing failed, use the whole summary
    if (summaryPoints.length === 0) {
      summaryPoints.push(summaryText.substring(0, 500))
    }
    
    return {
      summary: summaryText,
      summaryPoints: summaryPoints.slice(0, 6), // Limit to 6 points
    }
  } catch (error) {
    console.error('Error generating query-aware summary:', error)
    // Fallback: return empty summary
    return {
      summary: '',
      summaryPoints: [],
    }
  }
}

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
          doc_summary: match.metadata?.doc_summary || null,
          doc_summary_points: (() => {
            try {
              const points = match.metadata?.doc_summary_points
              if (!points) return null
              if (typeof points === 'string') {
                return JSON.parse(points)
              }
              if (Array.isArray(points)) {
                return points
              }
              return null
            } catch {
              return null
            }
          })(),
          data_url: match.metadata?.data_url || null,
        }
      }) || []

    // Generate query-aware summary from top results (use raw matches for metadata access)
    const rawMatches = searchResults.matches || []
    const querySummary = await generateQueryAwareSummary(query, rawMatches, 5)

    const searchTime = (Date.now() - startTime) / 1000

    return NextResponse.json({
      results,
      query,
      total_results: results.length,
      search_time: searchTime,
      summary: querySummary.summary,
      summary_points: querySummary.summaryPoints,
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
