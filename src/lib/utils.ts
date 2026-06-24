import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function confidenceColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-red-400'
}

export function confidenceBorder(score: number): string {
  if (score >= 70) return 'border-l-emerald-500'
  if (score >= 40) return 'border-l-amber-500'
  return 'border-l-red-500'
}

export function severityColor(s: string): string {
  if (s === 'alta') return 'text-red-400 bg-red-500/10'
  if (s === 'media') return 'text-amber-400 bg-amber-500/10'
  return 'text-slate-400 bg-slate-500/10'
}
