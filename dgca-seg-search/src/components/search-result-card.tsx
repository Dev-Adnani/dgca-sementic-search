'use client'

import { SearchResult } from '@/types/search'
import { formatScore, formatFileName, truncateText } from '@/lib/utils'
import { FileText, Calendar, Tag } from 'lucide-react'

interface SearchResultCardProps {
  result: SearchResult
  searchQuery?: string
}

export default function SearchResultCard({
  result,
  searchQuery,
}: SearchResultCardProps) {
  const highlightText = (text: string | undefined | null) => {
    if (!text || !searchQuery) return text || ''

    const regex = new RegExp(`(${searchQuery})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return (
          <mark key={index} className="rounded bg-yellow-200 px-1">
            {part}
          </mark>
        )
      }
      return part
    })
  }

  // Add defensive checks for all result properties
  const safeResult = {
    file_name: result?.file_name || 'Unknown File',
    chunk_id: result?.chunk_id || 0,
    content: result?.content || 'No content available',
    score: result?.score || 0,
    category: result?.category || 'INCIDENT',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              safeResult.category === 'INCIDENT'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <Tag className="mr-1 h-3 w-3" />
            {safeResult.category}
          </span>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            {formatScore(safeResult.score)} match
          </span>
        </div>
      </div>

      {/* File name */}
      <div className="mb-3">
        <h3 className="text-lg leading-tight font-semibold text-gray-900">
          {formatFileName(safeResult.file_name)}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{safeResult.file_name}</p>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none">
        <p className="leading-relaxed text-gray-700">
          {highlightText(truncateText(safeResult.content, 300))}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>DGCA Aviation Report</span>
          </div>
          <span className="text-xs text-gray-400">
            Report ID: {safeResult.chunk_id}
          </span>
        </div>
      </div>
    </div>
  )
}
