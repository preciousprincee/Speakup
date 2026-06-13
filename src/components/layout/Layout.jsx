import React from 'react'
import { LayoutDashboard, MessageSquare, BookOpen, Mic, Settings, Sun, Moon } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'coach', label: 'Coach', icon: MessageSquare },
  { id: 'jargon', label: 'Jargon', icon: BookOpen },
  { id: 'interview', label: 'Interview', icon: Mic },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function Layout({ children, activeTab, onTabChange, theme, onToggleTheme, profile }) {
  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-ink-900/80 backdrop-blur-md border-b border-ink-100 dark:border-ink-800 safe-top">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-mint flex items-center justify-center">
              <span className="text-white text-sm font-display font-bold">S</span>
            </div>
            <span className="font-display font-semibold text-ink-800 dark:text-ink-50">SpeakUp</span>
          </div>
          <div className="flex items-center gap-3">
            {profile?.xp > 0 && (
              <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-full">
                <span className="text-sm">⚡</span>
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 font-mono">{profile.xp} XP</span>
              </div>
            )}
            {profile?.streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-full">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 font-mono">{profile.streak}</span>
              </div>
            )}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-ink-500 dark:text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-28 animate-fade-in">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-ink-900/90 backdrop-blur-md border-t border-ink-100 dark:border-ink-800 safe-bottom">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => onTabChange(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 ${
                  active
                    ? 'text-brand-500'
                    : 'text-ink-400 dark:text-ink-600 hover:text-ink-600 dark:hover:text-ink-400'
                }`}
              >
                <div className={`relative p-1 rounded-xl transition-all ${active ? 'bg-brand-100 dark:bg-brand-900/40' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-500 rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-brand-500' : ''}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
