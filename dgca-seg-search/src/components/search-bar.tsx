"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  loading?: boolean;
}

export default function SearchBar({
  onSearch,
  placeholder = "Search incidents, accidents, or specific aircraft...",
  className,
  loading = false,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "group relative flex w-full items-center overflow-hidden rounded-full border bg-white shadow-lg transition-all duration-300 dark:bg-card",
          isFocused
            ? "border-primary/50 shadow-xl shadow-primary/5 ring-4 ring-primary/10"
            : "border-border/50 hover:border-border hover:shadow-xl",
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center text-muted-foreground transition-colors group-focus-within:text-primary pl-2">
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Search className="h-6 w-6" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="h-16 flex-1 bg-transparent pr-4 text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />

        <div className="pr-3">
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className={cn(
              "rounded-full px-8 py-3 text-sm font-semibold transition-all",
              query.trim()
                ? "bg-primary text-primary-foreground hover:bg-blue-700 hover:shadow-md active:scale-95"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
            )}
          >
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
