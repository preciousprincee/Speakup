import React, { useState, useEffect } from 'react'
import { Flame, Zap, Trophy, Target, RefreshCw, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { getProgress } from '../../utils/storage'
import { groqChat } from '../../utils/groq'
import { LoadingSpinner } from '../shared/UI'

const AFFIRMATIONS = [
  "Your voice deserves to be heard. Speak with intention today.",
  "Every expert was once a beginner. Keep going.",
  "Confidence isn't about having all the answers — it's about showing up anyway.",
  "The most powerful thing you can do is speak your truth clearly.",
  "Today's practice is tomorrow's fluency.",
  "You belong in every room you walk into.",
  "Business vocabulary is a skill, not a talent. You're building it daily.",
]

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'from-brand-500/20 to-brand-600/5 border-brand-200 dark:border-brand-800',
    gold: 'from-yellow-500/20 to-yellow-600/5 border-yellow-200 dark:border-yellow-800',
    mint: 'from-emerald-500/20 to-emerald-600/5 border-emerald-200 dark:border-emerald-800',
    coral: 'from-red-500/20 to-red-600/5 border-red-200 dark:border-red-800',
  }
  const iconColors = {
    brand: 'text-brand-500', gold: 'text-yellow-500', mint: 'text-emerald-500', coral: 'text-red-500'
  }
  return (
    <div className={`card p-4 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <Icon size={18} className={iconColors[color]} />
        <span className="label">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold text-ink-800 dark:text-ink-50">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function XPChart({ data }) {
  if (!data?.length) return (
    <div className="h-32 flex items-center justify-center">
      <p className="text-sm text-ink-400">Complete sessions to see your XP history</p>
    </div>
  )

  const chartData = data.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString('en', { weekday: 'short' }),
    xp: d.xp
  }))

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7878a8' }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#1a1a38', border: 'none', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#a8a8c9' }}
          itemStyle={{ color: '#6C63FF' }}
        />
        <Area type="monotone" dataKey="xp" stroke="#6C63FF" strokeWidth={2} fill="url(#xpGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function Dashboard({ profile, progress, onTabChange }) {
  const [affirmation, setAffirmation] = useState('')
  const [aiAffirmation, setAiAffirmation] = useState('')
  const [loadingAffirmation, setLoadingAffirmation] = useState(false)

  useEffect(() => {
    const today = new Date().toDateString()
    const cached = sessionStorage.getItem('speakup_aff_' + today)
    if (cached) { setAffirmation(cached); return }
    const random = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]
    setAffirmation(random)
    sessionStorage.setItem('speakup_aff_' + today, random)
  }, [])

  const fetchAiAffirmation = async () => {
    setLoadingAffirmation(true)
    try {
      const msg = await groqChat([{
        role: 'user',
        content: `Generate one short, powerful motivational affirmation (1-2 sentences max) for someone learning to speak more confidently in professional settings. Make it specific, grounded, and not generic. No quotes or labels.`
      }], { maxTokens: 80 })
      setAiAffirmation(msg.trim())
    } catch {}
    setLoadingAffirmation(false)
  }

  const jargonLearned = progress?.jargonLearned?.length || 0
  const sessions = (progress?.completedPrompts?.length || 0) + (progress?.interviewSessions?.length || 0) + (progress?.roleplaySessions?.length || 0)
  const level = Math.floor((profile?.xp || 0) / 200) + 1
  const xpToNext = 200 - ((profile?.xp || 0) % 200)

  const quickActions = [
    { label: 'Daily Prompt', emoji: '🎯', tab: 'coach' },
    { label: 'Learn Jargon', emoji: '📖', tab: 'jargon' },
    { label: 'Practice Interview', emoji: '🎙️', tab: 'interview' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting */}
      <div>
        <p className="label">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}</p>
        <h1 className="font-display text-2xl font-bold text-ink-800 dark:text-ink-50 mt-0.5">
          {profile?.name ? `${profile.name} 👋` : 'Ready to level up? 👋'}
        </h1>
        <p className="text-sm text-ink-400 mt-1">Level {level} · {xpToNext} XP to next level</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Zap} label="Total XP" value={profile?.xp || 0} sub="Points earned" color="brand" />
        <StatCard icon={Flame} label="Streak" value={`${profile?.streak || 0}d`} sub="Keep it going!" color="gold" />
        <StatCard icon={BookOpen_} label="Jargon" value={jargonLearned} sub="Terms learned" color="mint" />
        <StatCard icon={Trophy} label="Sessions" value={sessions} sub="Completed" color="coral" />
      </div>

      {/* XP Chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" /> XP History
          </h2>
          <span className="label">Last 14 days</span>
        </div>
        <XPChart data={progress?.dailyXP} />
      </div>

      {/* Daily Affirmation */}
      <div className="card p-5 bg-gradient-to-br from-brand-600 to-brand-800 border-brand-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="label text-brand-300 mb-2">Today's affirmation</p>
            <p className="text-white font-medium leading-relaxed text-sm">
              {aiAffirmation || affirmation}
            </p>
          </div>
          <button
            onClick={fetchAiAffirmation}
            disabled={loadingAffirmation}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            {loadingAffirmation ? <LoadingSpinner size={14} className="text-white" /> : <RefreshCw size={14} />}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="section-title mb-3">Jump back in</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ label, emoji, tab }) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="card-hover p-4 flex flex-col items-center gap-2 text-center"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {progress?.interviewSessions?.length > 0 && (
        <div className="card p-4">
          <h2 className="section-title mb-3">Recent interviews</h2>
          <div className="space-y-2">
            {progress.interviewSessions.slice(-3).reverse().map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-ink-100 dark:border-ink-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{s.jobRole}</p>
                  <p className="text-xs text-ink-400">{new Date(s.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-brand-500">{s.score}%</p>
                  <p className="text-xs text-ink-400">{s.questionsAnswered} questions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line react/display-name
const BookOpen_ = ({ size, className }) => (
  <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
)
