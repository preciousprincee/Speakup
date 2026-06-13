import React, { useEffect, useState } from 'react'

export function Badge({ children, color = 'brand', className = '' }) {
  const colors = {
    brand: 'bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300',
    green: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300',
    gold: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-300',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
    gray: 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400',
    purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300',
  }
  return (
    <span className={`badge ${colors[color] || colors.brand} ${className}`}>{children}</span>
  )
}

export function ProgressBar({ value, max = 100, color = 'brand', size = 'md', showLabel = false }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }
  const colors = {
    brand: 'bg-gradient-to-r from-brand-500 to-accent-mint',
    gold: 'bg-gradient-to-r from-accent-gold to-yellow-400',
    green: 'bg-gradient-to-r from-accent-mint to-emerald-400',
  }
  return (
    <div className="w-full">
      <div className={`w-full bg-ink-100 dark:bg-ink-700 rounded-full ${heights[size]} overflow-hidden`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-700 ${colors[color] || colors.brand}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <p className="text-xs text-ink-400 mt-1">{pct}%</p>}
    </div>
  )
}

export function LoadingSpinner({ size = 24, className = '' }) {
  return (
    <svg
      className={`animate-spin text-brand-500 ${className}`}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

export function XPBurst({ amount, onDone }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.() }, 1800)
    return () => clearTimeout(t)
  }, [onDone])

  if (!visible) return null
  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-up pointer-events-none">
      <div className="bg-accent-gold text-ink-900 font-display font-bold text-lg px-4 py-2 rounded-2xl shadow-lg shadow-yellow-500/30">
        +{amount} XP ⚡
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
        <Icon size={28} className="text-brand-500" />
      </div>
      <div>
        <h3 className="font-display font-semibold text-ink-700 dark:text-ink-200 mb-1">{title}</h3>
        <p className="text-sm text-ink-400 dark:text-ink-500 max-w-xs">{description}</p>
      </div>
      {action}
    </div>
  )
}
