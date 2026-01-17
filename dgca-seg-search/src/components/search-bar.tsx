'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
  loading?: boolean
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search incidents, accidents, or aircraft...',
  className,
  loading = false
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className="flex w-full items-center rounded-full border border-slate-300 bg-white shadow-sm transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20">
        <div className="flex h-14 w-14 items-center justify-center text-slate-400">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-14 flex-1 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!query.trim() || loading}
          className={cn(
            "mr-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
            query.trim()
              ? "bg-sky-500 text-white hover:bg-sky-600"
              : "bg-slate-100 text-slate-400"
          )}
        >
          Search
        </button>
      </div>
    </form>
  )
}
