"use client";
import { Analytics } from "@vercel/analytics/next";
import { useState, useRef } from "react";
import { Plane, Search, AlertCircle, Loader2 } from "lucide-react";
import SearchBar from "@/components/search-bar";
import CategoryFilter from "@/components/category-filter";
import SearchResultCard from "@/components/search-result-card";
import AirplaneHero from "@/components/airplane-hero";
import { useSearch, useStats } from "@/hooks/useSearch";
import { SearchCategory } from "@/types/search";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SearchCategory>("all");
  const searchSectionRef = useRef<HTMLDivElement>(null);

  const {
    data: searchResults,
    isLoading,
    error,
  } = useSearch(query, category, 10);
  const { data: stats } = useStats();

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen font-sans text-foreground selection:bg-primary/30">
      {/* Hero Section */}
      <AirplaneHero
        title="DGCA AVIATION REPORTS"
        subtitle="SEMANTIC SEARCH // INCIDENT & ACCIDENT ANALYSIS SYSTEM"
        ctaText="INITIALIZE SEARCH"
        onCta={scrollToSearch}
      >
        {stats ? (
          <div className="mt-8 grid grid-cols-2 gap-8 divide-x divide-primary/20 border-t border-primary/20 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold tracking-tighter text-foreground font-mono">
                {stats.total_documents.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                DOCUMENTS_INDEXED
              </div>
            </div>
            <div className="text-center pl-8">
              <div className="text-3xl font-bold tracking-tighter text-foreground font-mono">
                {stats.total_chunks.toLocaleString()}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                DATA_CHUNKS
              </div>
            </div>
          </div>
        ) : null}
      </AirplaneHero>

      {/* Main Content */}
      <main
        ref={searchSectionRef}
        className="relative z-20 mx-auto mt-0 max-w-5xl px-4 pb-20 sm:px-6 lg:px-8"
      >
        {/* Search Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mb-12 bg-background/95 p-8 shadow-2xl backdrop-blur-xl dark:bg-card/95 border-y-4 border-primary/20"
        >
          <div className="mx-auto max-w-3xl space-y-8">
            <SearchBar
              onSearch={handleSearch}
              loading={isLoading}
              className="w-full"
            />
            <div className="flex justify-center">
              <CategoryFilter selected={category} onSelect={setCategory} />
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {query && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Results Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-lg font-bold tracking-wider text-foreground uppercase">
                  QUERY_RESULTS: <span className="text-primary">"{query}"</span>
                  {category !== "all" && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground normal-case">
                      [{category}]
                    </span>
                  )}
                </h2>
                {searchResults && (
                  <span className="font-mono text-xs text-muted-foreground">
                    FOUND: {searchResults.total_results} | TIME:{" "}
                    {searchResults.search_time.toFixed(4)}s
                  </span>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
                    <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                  </div>
                  <span className="mt-4 text-sm font-bold tracking-widest text-muted-foreground uppercase">
                    SCANNING DATABASE...
                  </span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex items-center justify-center py-24">
                  <div className="border border-red-500/20 bg-red-500/5 p-8 text-center text-red-500 font-mono">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-bold tracking-widest">
                      SYSTEM_ERROR
                    </h3>
                    <p className="text-sm opacity-90">
                      CONNECTION_FAILED. CHECK API CONFIGURATION.
                    </p>
                  </div>
                </div>
              )}

              {/* Results */}
              {searchResults && searchResults.results.length > 0 && (
                <div className="grid gap-6">
                  {searchResults.results.map((result, index) => (
                    <motion.div
                      key={`${result.file_name}-${result.chunk_id}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <SearchResultCard result={result} searchQuery={query} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {searchResults && searchResults.results.length === 0 && (
                <div className="py-24 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground tracking-widest uppercase">
                    NO_MATCHES_FOUND
                  </h3>
                  <p className="text-muted-foreground font-mono text-xs">
                    ADJUST PARAMETERS AND RETRY.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome State */}
        {!query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="py-24 text-center"
          >
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-none bg-primary/5 border border-primary/20">
              <Plane className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mb-4 text-2xl font-bold tracking-widest text-foreground uppercase">
              SYSTEM READY
            </h2>
            <p className="mx-auto max-w-xl text-sm font-mono text-muted-foreground">
              AWAITING INPUT. ACCESSING DGCA INCIDENT & ACCIDENT DATABASE...
            </p>
          </motion.div>
        )}
      </main>
      <Analytics />
    </div>
  );
}
