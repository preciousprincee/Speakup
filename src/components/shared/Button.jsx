import React from 'react'
import { Loader2 } from 'lucide-react'

export function Button({ children, variant = 'primary', loading, className = '', ...props }) {
  const base = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-2',
  }[variant]

  return (
    <button className={`${base} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
