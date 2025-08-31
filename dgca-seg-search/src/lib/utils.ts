import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return (score * 100).toFixed(1) + '%'
}

export function truncateText(
  text: string | undefined | null,
  maxLength: number
): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function highlightSearchTerm(
  text: string | undefined | null,
  searchTerm: string
): string {
  if (!text || !searchTerm) return text || ''

  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
  )
}

export function formatFileName(fileName: string | undefined | null): string {
  // Handle undefined or null fileName
  if (!fileName) {
    return 'Unknown Document'
  }

  // Extract meaningful parts from DGCA file names
  const parts = fileName.replace(/\.pdf$/, '').split('_')
  if (parts.length > 2) {
    const date = parts[0]
    const type = parts.slice(1, 3).join(' ')
    return `${date} - ${type}`
  }
  return fileName.replace(/\.pdf$/, '')
}
