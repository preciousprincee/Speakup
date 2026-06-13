import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'

export function useTheme() {
  const [theme, setTheme] = useState(() => storage.get('theme', 'dark'))

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    storage.set('theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}
