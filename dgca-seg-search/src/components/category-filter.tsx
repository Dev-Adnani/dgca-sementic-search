"use client";

import { SearchCategory } from "@/types/search";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CategoryFilterProps {
  selected: SearchCategory;
  onSelect: (category: SearchCategory) => void;
  className?: string;
}

const categories = [
  {
    value: "all" as const,
    label: "All Reports",
  },
  {
    value: "incident" as const,
    label: "Incidents",
  },
  {
    value: "accident" as const,
    label: "Accidents",
  },
];

export default function CategoryFilter({
  selected,
  onSelect,
  className,
}: CategoryFilterProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-full border border-border/50 bg-background/50 p-1 backdrop-blur-sm",
        className,
      )}
    >
      {categories.map((category) => {
        const isSelected = selected === category.value;
        return (
          <button
            type="button"
            key={category.value}
            onClick={() => onSelect(category.value)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none",
              isSelected
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            <span className="relative z-10">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}
