import { SearchResult, SearchResponse, SearchCategory } from '@/types/search'

export class SearchService {
  static async search(
    query: string,
    category: SearchCategory = 'all',
    limit: number = 10
  ): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams()
      params.append('q', query)

      if (category !== 'all') {
        params.append('category', category)
      }
      if (limit) {
        params.append('limit', limit.toString())
      }

      const response = await fetch(`/api/search?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Search failed')
      }

      return await response.json()
    } catch (error) {
      console.error('Search error:', error)
      throw new Error('Search failed')
    }
  }

  static async getStats(): Promise<{
    total_documents: number
    total_chunks: number
    categories: Record<string, number>
  }> {
    try {
      const response = await fetch('/api/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      return await response.json()
    } catch (error) {
      console.error('Stats error:', error)
      return {
        total_documents: 0,
        total_chunks: 0,
        categories: {},
      }
    }
  }
}
