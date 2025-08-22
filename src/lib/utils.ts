import { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import clsx from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSeconds(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Range parsing utilities
export function isRange(value: string | number): boolean {
  if (typeof value === 'number') return false
  return value.includes('-')
}

export function parseRange(value: string | number): { min: number; max: number } | null {
  if (typeof value === 'number') return null

  const parts = value.split('-').map(p => p.trim())
  if (parts.length !== 2) return null

  const min = parseInt(parts[0], 10)
  const max = parseInt(parts[1], 10)

  if (isNaN(min) || isNaN(max) || min >= max) return null

  return { min, max }
}

export function getRandomFromRange(value: string | number): number {
  if (typeof value === 'number') return value

  const range = parseRange(value)
  if (!range) return 0 // fallback for invalid ranges

  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
}

export function formatRangeDisplay(value: string | number): string {
  if (typeof value === 'number') return value.toString()

  const range = parseRange(value)
  if (range) return `${range.min}-${range.max}`

  return value
}

// Convert string | number to number safely
export function toNumber(value: string | number): number {
  if (typeof value === 'number') return value

  // If it's a range, return the minimum value
  const range = parseRange(value)
  if (range) return range.min

  // Try to parse as number
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? 0 : parsed
}

// Get rest time options from restSec (handles both number and range strings)
export function getRestTimeOptions(restSec: string | number): { min: number; max: number; options: number[] } {
  if (typeof restSec === 'number') {
    return { min: restSec, max: restSec, options: [restSec] }
  }

  const range = parseRange(restSec)
  if (range) {
    // For ranges like "120-180", provide options for min and max
    return { min: range.min, max: range.max, options: [range.min, range.max] }
  }

  // Fallback to parsing as number
  const parsed = parseInt(restSec, 10)
  return isNaN(parsed) ? { min: 60, max: 60, options: [60] } : { min: parsed, max: parsed, options: [parsed] }
}

// Get the shorter rest time from a restSec range
export function getShorterRest(restSec: string | number): number {
  const options = getRestTimeOptions(restSec)
  return Math.min(...options.options)
}

// Get the longer rest time from a restSec range
export function getLongerRest(restSec: string | number): number {
  const options = getRestTimeOptions(restSec)
  return Math.max(...options.options)
}


