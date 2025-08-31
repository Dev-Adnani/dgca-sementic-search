'use client'

import { useState, useRef } from 'react'
import { Plane, Search, AlertCircle, Loader2 } from 'lucide-react'
import SearchBar from '@/components/search-bar'
import CategoryFilter from '@/components/category-filter'
import SearchResultCard from '@/components/search-result-card'
import AirplaneHero from '@/components/airplane-hero'
import { useSearch, useStats } from '@/hooks/useSearch'
import { SearchCategory } from '@/types/search'

export default function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SearchCategory>('all')
  const searchSectionRef = useRef<HTMLDivElement>(null)

  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearch(query, category, 10)
  const { data: stats } = useStats()

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery)
  }

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <AirplaneHero
        title="DGCA Aviation Reports"
        subtitle="Search and explore Indian aviation incident and accident reports with advanced semantic search"
        ctaText="Start Searching"
        onCta={scrollToSearch}
      >
        {stats && (
          <div className="mt-4 flex items-center justify-center space-x-8 text-sm text-white/80">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {stats.total_documents}
              </div>
              <div>Documents</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {stats.total_chunks}
              </div>
              <div>Chunks</div>
            </div>
          </div>
        )}
      </AirplaneHero>

      {/* Main Content */}
      <main
        ref={searchSectionRef}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      >
        {/* Search Section */}
        <div className="mb-8">
          <div className="mx-auto max-w-3xl">
            <SearchBar onSearch={handleSearch} className="mb-6" />
            <CategoryFilter
              selected={category}
              onSelect={setCategory}
              className="justify-center"
            />
          </div>
        </div>

        {/* Results Section */}
        {query && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results for "{query}"
                {category !== 'all' && (
                  <span className="ml-2 text-base font-normal text-gray-600">
                    in {category} reports
                  </span>
                )}
              </h2>
              {searchResults && (
                <span className="text-sm text-gray-500">
                  {searchResults.total_results} results (
                  {searchResults.search_time.toFixed(2)}s)
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Searching reports...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Search Failed
                  </h3>
                  <p className="text-gray-600">
                    Unable to search reports. Please check your API
                    configuration.
                  </p>
                </div>
              </div>
            )}

            {/* Results */}
            {searchResults && searchResults.results.length > 0 && (
              <div className="space-y-4">
                {searchResults.results.map((result, index) => (
                  <SearchResultCard
                    key={`${result.file_name}-${result.chunk_id}-${index}`}
                    result={result}
                    searchQuery={query}
                  />
                ))}
              </div>
            )}

            {/* No Results */}
            {searchResults && searchResults.results.length === 0 && (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or changing the category
                  filter.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Welcome State */}
        {!query && (
          <div className="py-16 text-center">
            <Plane className="mx-auto mb-6 h-16 w-16 text-blue-600" />
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Welcome to DGCA Aviation Reports Search
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
              Search through thousands of Indian aviation incident and accident
              reports from the Directorate General of Civil Aviation (DGCA)
              using advanced semantic search.
            </p>
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <Search className="mb-3 h-8 w-8 text-blue-600" />
                <h3 className="mb-2 font-semibold text-gray-900">
                  Smart Search
                </h3>
                <p className="text-sm text-gray-600">
                  Use natural language to find relevant aviation reports and
                  incidents
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <AlertCircle className="mb-3 h-8 w-8 text-yellow-600" />
                <h3 className="mb-2 font-semibold text-gray-900">
                  Categorized
                </h3>
                <p className="text-sm text-gray-600">
                  Filter between incident and accident reports for targeted
                  research
                </p>
              </div>
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <Plane className="mb-3 h-8 w-8 text-green-600" />
                <h3 className="mb-2 font-semibold text-gray-900">
                  Comprehensive
                </h3>
                <p className="text-sm text-gray-600">
                  Access detailed investigation reports from Indian aviation
                  authorities
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
