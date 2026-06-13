const PREFIX = 'speakup_'

export const storage = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(PREFIX + key)
      return v !== null ? JSON.parse(v) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(PREFIX + key) } catch {}
  }
}

export const getApiKey = () => storage.get('groq_api_key', '')
export const setApiKey = (key) => storage.set('groq_api_key', key)

export const getProfile = () => storage.get('profile', {
  name: '',
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  totalSessions: 0,
  theme: 'dark'
})
export const setProfile = (p) => storage.set('profile', p)

export const getProgress = () => storage.get('progress', {
  jargonLearned: [],
  completedPrompts: [],
  interviewSessions: [],
  roleplaySessions: [],
  dailyXP: []
})
export const setProgress = (p) => storage.set('progress', p)

export const addXP = (amount) => {
  const profile = getProfile()
  const progress = getProgress()
  const today = new Date().toISOString().split('T')[0]

  // update streak
  const last = profile.lastActiveDate
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  let streak = profile.streak || 0
  if (last === yesterday) streak += 1
  else if (last !== today) streak = last ? 1 : (streak || 1)

  const newProfile = {
    ...profile,
    xp: (profile.xp || 0) + amount,
    streak,
    lastActiveDate: today,
    totalSessions: (profile.totalSessions || 0) + 1
  }
  setProfile(newProfile)

  // track daily XP
  const dailyXP = progress.dailyXP || []
  const todayEntry = dailyXP.find(d => d.date === today)
  if (todayEntry) todayEntry.xp += amount
  else dailyXP.push({ date: today, xp: amount })
  setProgress({ ...progress, dailyXP: dailyXP.slice(-30) })

  return newProfile
}
