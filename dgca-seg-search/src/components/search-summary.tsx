"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";

interface SearchSummaryProps {
  summary?: string;
  summaryPoints?: string[];
  query: string;
}

export default function SearchSummary({
  summary,
  summaryPoints,
  query,
}: SearchSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // If no summary data, don't render
  if (!summary && (!summaryPoints || summaryPoints.length === 0)) {
    return null;
  }

  const points = summaryPoints || [];
  const hasMultiplePoints = points.length > 0;

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Summary for "{query}"
            </h3>
            <p className="text-sm text-gray-600">
              {hasMultiplePoints
                ? `${points.length} key points extracted from search results`
                : "AI-generated summary"}
            </p>
          </div>
        </div>
        <button
          className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-blue-100 hover:text-gray-700"
          aria-label={isExpanded ? "Collapse summary" : "Expand summary"}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Summary Content */}
      {isExpanded && (
        <div className="border-t border-blue-200 px-4 pb-4 pt-4">
          {hasMultiplePoints ? (
            <ul className="space-y-3">
              {points.map((point, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-3 rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex-shrink-0">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </div>
                  </div>
                  <p className="flex-1 leading-relaxed text-gray-700">
                    {point}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <p className="leading-relaxed text-gray-700">{summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
