import { useQuery } from '@tanstack/react-query'
import { SearchService } from '@/lib/search-service'
import { SearchCategory } from '@/types/search'

export function useSearch(
  query: string,
  category: SearchCategory = 'all',
  limit: number = 10
) {
  return useQuery({
    queryKey: ['search', query, category, limit],
    queryFn: () => SearchService.search(query, category, limit),
    enabled: !!query && query.length > 2, // Only search if query is meaningful
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: SearchService.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}
