'use client'

import { SearchCategory } from '@/types/search'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  selected: SearchCategory
  onSelect: (category: SearchCategory) => void
  className?: string
}

const categories = [
  {
    value: 'all' as const,
    label: 'All Reports',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    value: 'incident' as const,
    label: 'Incidents',
    color: 'bg-yellow-100 text-yellow-700',
  },
  {
    value: 'accident' as const,
    label: 'Accidents',
    color: 'bg-red-100 text-red-700',
  },
]

export default function CategoryFilter({
  selected,
  onSelect,
  className,
}: CategoryFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => onSelect(category.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-all',
            selected === category.value
              ? `${category.color} ring-2 ring-blue-500 ring-offset-2`
              : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
