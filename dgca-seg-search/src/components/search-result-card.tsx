'use client'

import { useState } from 'react'
import { SearchResult } from '@/types/search'
import { formatScore, formatFileName, truncateText } from '@/lib/utils'
import { FileText, Calendar, Tag, ChevronDown, ChevronUp, Sparkles, ExternalLink } from 'lucide-react'

interface SearchResultCardProps {
  result: SearchResult
  searchQuery?: string
}

export default function SearchResultCard({
  result,
  searchQuery,
}: SearchResultCardProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
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
    doc_summary: result?.doc_summary || null,
    doc_summary_points: result?.doc_summary_points || null,
    data_url: result?.data_url || null,
  }
  
  // Build DGCA URL if data_url is available
  // Based on actual DGCA URL patterns:
  // Accident: ...dynamicPdf/{data-url}&mainAccidentReports/500005/0/viewApplicationDtlsReq
  // Incident: ...dynamicPdf/{data-url}&mainIncidentReports/500006/0/viewApplicationDtlsReq
  const getDgcaUrl = () => {
    if (!safeResult.data_url) return null
    
    const baseUrl = 'https://www.dgca.gov.in/digigov-portal/?baseLocale=en_US?dynamicPage=dynamicPdf/'
    
    // Build the full URL based on category
    if (safeResult.category === 'INCIDENT') {
      // Incident reports use 500006
      return `${baseUrl}${safeResult.data_url}&mainIncidentReports/500006/0/viewApplicationDtlsReq`
    } else {
      // Accident reports use 500005
      return `${baseUrl}${safeResult.data_url}&mainAccidentReports/500005/0/viewApplicationDtlsReq`
    }
  }
  
  const dgcaUrl = getDgcaUrl()

  // Parse summary points if it's a JSON string
  let summaryPoints: string[] = []
  if (safeResult.doc_summary_points) {
    if (typeof safeResult.doc_summary_points === 'string') {
      try {
        summaryPoints = JSON.parse(safeResult.doc_summary_points)
      } catch {
        summaryPoints = []
      }
    } else if (Array.isArray(safeResult.doc_summary_points)) {
      summaryPoints = safeResult.doc_summary_points
    }
  }

  const hasSummary = safeResult.doc_summary || summaryPoints.length > 0

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

      {/* Document Summary Accordion */}
      {hasSummary && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="flex w-full items-center justify-between rounded-lg bg-blue-50 px-4 py-3 text-left transition-colors hover:bg-blue-100"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900">
                Document Summary
              </span>
            </div>
            {isSummaryExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {isSummaryExpanded && (
            <div className="mt-3 rounded-lg border border-blue-100 bg-white p-4">
              {summaryPoints.length > 0 ? (
                <ul className="space-y-2">
                  {summaryPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start space-x-3 text-sm text-gray-700"
                    >
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="flex-1 leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-gray-700">
                  {safeResult.doc_summary}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>DGCA Aviation Report</span>
          </div>
          <div className="flex items-center space-x-3">
            {dgcaUrl && (
              <a
                href={dgcaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
              >
                <ExternalLink className="h-3 w-3" />
                <span>View PDF</span>
              </a>
            )}
            <span className="text-xs text-gray-400">
              Report ID: {safeResult.chunk_id}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
