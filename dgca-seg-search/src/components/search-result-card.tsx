"use client";

import { useState } from "react";
import { SearchResult } from "@/types/search";
import { formatScore, formatFileName, truncateText } from "@/lib/utils";
import {
  FileText,
  ChevronDown,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchResultCardProps {
  result: SearchResult;
  searchQuery?: string;
}

export default function SearchResultCard({
  result,
  searchQuery,
}: SearchResultCardProps) {
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const highlightText = (text: string | undefined | null) => {
    if (!text || !searchQuery) return text || "";

    const regex = new RegExp(`(${searchQuery})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === searchQuery.toLowerCase()) {
        return (
          <mark
            key={index}
            className="bg-yellow-100 text-yellow-800 rounded-sm px-0.5 font-medium"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // Defensive checks
  const safeResult = {
    file_name: result?.file_name || "Unknown File",
    chunk_id: result?.chunk_id || 0,
    content: result?.content || "No content available",
    score: result?.score || 0,
    category: result?.category || "INCIDENT",
    doc_summary: result?.doc_summary || null,
    doc_summary_points: result?.doc_summary_points || null,
    data_url: result?.data_url || null,
  };

  const getDgcaUrl = () => {
    if (!safeResult.data_url) return null;
    const baseUrl =
      "https://www.dgca.gov.in/digigov-portal/?baseLocale=en_US?dynamicPage=dynamicPdf/";
    if (safeResult.category === "INCIDENT") {
      return `${baseUrl}${safeResult.data_url}&mainIncidentReports/500006/0/viewApplicationDtlsReq`;
    } else {
      return `${baseUrl}${safeResult.data_url}&mainAccidentReports/500005/0/viewApplicationDtlsReq`;
    }
  };

  const dgcaUrl = getDgcaUrl();
  const isIncident = safeResult.category === "INCIDENT";

  // Parse summary points
  let summaryPoints: string[] = [];
  if (safeResult.doc_summary_points) {
    if (typeof safeResult.doc_summary_points === "string") {
      try {
        summaryPoints = JSON.parse(safeResult.doc_summary_points);
      } catch {
        summaryPoints = [];
      }
    } else if (Array.isArray(safeResult.doc_summary_points)) {
      summaryPoints = safeResult.doc_summary_points;
    }
  }
  const hasSummary = safeResult.doc_summary || summaryPoints.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg dark:bg-card"
    >
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                isIncident
                  ? "bg-orange-50 text-orange-600"
                  : "bg-red-50 text-red-600",
              )}
            >
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3
                className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary transition-colors"
                title={safeResult.file_name}
              >
                {formatFileName(safeResult.file_name)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                    isIncident
                      ? "bg-orange-100 text-orange-700"
                      : "bg-red-100 text-red-700",
                  )}
                >
                  {safeResult.category}
                </span>
                <span className="text-xs text-muted-foreground">
                  ID: {safeResult.chunk_id}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Relavence
              </span>
              <span className="text-lg font-bold text-primary">
                {formatScore(safeResult.score)}
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="prose prose-sm prose-slate max-w-none text-muted-foreground mb-6 dark:prose-invert">
          <p className="leading-relaxed">
            {highlightText(truncateText(safeResult.content, 280))}
          </p>
        </div>

        {/* AI Summary (Accordion) */}
        {hasSummary && (
          <div className="mb-5 rounded-lg bg-slate-50 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
            <motion.button
              type="button"
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  AI Intelligence Brief
                </span>
              </div>
              <motion.div
                animate={{ rotate: isSummaryExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {isSummaryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                    {summaryPoints.length > 0 ? (
                      <ul className="space-y-2 mt-2">
                        {summaryPoints.map((point, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-sm text-foreground/80"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/40" />
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                        {safeResult.doc_summary}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer */}
        {dgcaUrl && (
          <div className="flex justify-end pt-2">
            <a
              href={dgcaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-blue-700 hover:underline underline-offset-4"
            >
              <span>View Official Report</span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}
