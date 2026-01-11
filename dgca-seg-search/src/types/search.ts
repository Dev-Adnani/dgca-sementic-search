export interface SearchResult {
  file_name?: string | null
  chunk_id?: number | null
  content?: string | null
  score?: number | null
  category?: 'INCIDENT' | 'ACCIDENT' | null
  doc_summary?: string | null
  doc_summary_points?: string[] | null
  data_url?: string | null
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
  total_results: number
  search_time: number
  summary?: string
  summary_points?: string[]
}

export interface SearchFilters {
  category?: 'incident' | 'accident'
  limit?: number
  minScore?: number
}

export interface APIError {
  message: string
  status: number
}

export type SearchCategory = 'all' | 'incident' | 'accident'
