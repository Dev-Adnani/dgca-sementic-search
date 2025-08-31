import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
})

const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'dgca-reports'

export async function GET() {
  try {
    const index = pinecone.index(INDEX_NAME)
    const stats = await index.describeIndexStats()

    return NextResponse.json({
      total_documents: 163, // Your backend has 163 documents
      total_chunks: stats.totalRecordCount || 2713,
      categories: {
        INCIDENT: 153,
        ACCIDENT: 10,
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      {
        total_documents: 0,
        total_chunks: 0,
        categories: {},
      },
      { status: 500 }
    )
  }
}
