import { getProfile, getProgress } from './storage'

export function exportCSV() {
  const profile = getProfile()
  const progress = getProgress()

  const rows = []

  // Header info
  rows.push(['SpeakUp Progress Export', new Date().toLocaleDateString()])
  rows.push([])
  rows.push(['Profile'])
  rows.push(['Name', profile.name || 'User'])
  rows.push(['Total XP', profile.xp || 0])
  rows.push(['Current Streak', profile.streak || 0])
  rows.push(['Total Sessions', profile.totalSessions || 0])
  rows.push([])

  // Daily XP
  rows.push(['Daily XP History'])
  rows.push(['Date', 'XP Earned'])
  ;(progress.dailyXP || []).forEach(d => rows.push([d.date, d.xp]))
  rows.push([])

  // Jargon learned
  rows.push(['Business Jargon Learned'])
  rows.push(['Term', 'Category', 'Date Learned'])
  ;(progress.jargonLearned || []).forEach(j => rows.push([j.term, j.category, j.date]))
  rows.push([])

  // Interview sessions
  rows.push(['Interview Sessions'])
  rows.push(['Date', 'Job Role', 'Score', 'Questions Answered'])
  ;(progress.interviewSessions || []).forEach(s =>
    rows.push([s.date, s.jobRole, s.score, s.questionsAnswered])
  )
  rows.push([])

  // Completed prompts
  rows.push(['Speaking Prompts Completed'])
  rows.push(['Date', 'Prompt', 'XP Earned'])
  ;(progress.completedPrompts || []).forEach(p =>
    rows.push([p.date, p.prompt?.substring(0, 60) + '...', p.xp || 20])
  )

  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `speakup_progress_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
