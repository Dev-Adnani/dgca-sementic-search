'use client'

import { useState } from 'react'
import { SearchResult } from '@/types/search'
import { formatScore, formatFileName, truncateText } from '@/lib/utils'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
        return <mark key={index} className="bg-yellow-200 px-0.5">{part}</mark>
      }
      return part
    })
  }

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

  const getDgcaUrl = () => {
    if (!safeResult.data_url) return null
    const baseUrl = 'https://www.dgca.gov.in/digigov-portal/?baseLocale=en_US?dynamicPage=dynamicPdf/'
    return safeResult.category === 'INCIDENT'
      ? `${baseUrl}${safeResult.data_url}&mainIncidentReports/500006/0/viewApplicationDtlsReq`
      : `${baseUrl}${safeResult.data_url}&mainAccidentReports/500005/0/viewApplicationDtlsReq`
  }

  const dgcaUrl = getDgcaUrl()
  const isIncident = safeResult.category === 'INCIDENT'

  let summaryPoints: string[] = []
  if (safeResult.doc_summary_points) {
    if (typeof safeResult.doc_summary_points === 'string') {
      try { summaryPoints = JSON.parse(safeResult.doc_summary_points) } catch { summaryPoints = [] }
    } else if (Array.isArray(safeResult.doc_summary_points)) {
      summaryPoints = safeResult.doc_summary_points
    }
  }
  const hasSummary = safeResult.doc_summary || summaryPoints.length > 0

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800">{formatFileName(safeResult.file_name)}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              isIncident ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
            )}>
              {safeResult.category}
            </span>
            <span className="text-xs text-slate-400">#{safeResult.chunk_id}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Match</div>
          <div className="text-lg font-bold text-sky-600">{formatScore(safeResult.score)}</div>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {highlightText(truncateText(safeResult.content, 280))}
      </p>

      {/* Summary */}
      {hasSummary && (
        <div className="mb-4 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="flex w-full items-center justify-between text-sm text-slate-600 hover:text-slate-800"
          >
            <span className="font-medium">AI Summary</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isSummaryExpanded && "rotate-180")} />
          </button>
          <AnimatePresence>
            {isSummaryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 text-sm text-slate-600">
                  {summaryPoints.length > 0 ? (
                    <ul className="space-y-1 list-disc list-inside">
                      {summaryPoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  ) : (
                    <p>{safeResult.doc_summary}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Footer */}
      {dgcaUrl && (
        <a
          href={dgcaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
        >
          View Report <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}
