import React, { useState } from 'react'
import { Key, Download, Trash2, User, ExternalLink, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getApiKey, setApiKey, getProfile, setProfile, setProgress, storage } from '../../utils/storage'
import { exportCSV } from '../../utils/export'
import { Button } from '../shared/Button'

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-display font-semibold text-ink-700 dark:text-ink-200">{title}</h2>
      {children}
    </div>
  )
}

export function Settings({ onProfileUpdate }) {
  const [apiKey, setApiKeyState] = useState(() => getApiKey())
  const [showKey, setShowKey] = useState(false)
  const [keySaved, setKeySaved] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [testing, setTesting] = useState(false)
  const [name, setName] = useState(() => getProfile().name || '')
  const [nameSaved, setNameSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [exported, setExported] = useState(false)

  const saveApiKey = async () => {
    if (!apiKey.trim()) { setKeyError('Please enter an API key.'); return }
    if (!apiKey.trim().startsWith('gsk_')) { setKeyError('Groq keys start with "gsk_"'); return }
    setTesting(true)
    setKeyError('')
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      })
      if (!res.ok) throw new Error()
      setApiKey(apiKey.trim())
      setKeySaved(true)
      setTimeout(() => setKeySaved(false), 2000)
    } catch {
      setKeyError('Could not verify this key. Check it and try again.')
    }
    setTesting(false)
  }

  const saveName = () => {
    const p = getProfile()
    setProfile({ ...p, name: name.trim() })
    onProfileUpdate()
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const handleExport = () => {
    exportCSV()
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  const resetProgress = () => {
    setProgress({
      jargonLearned: [],
      completedPrompts: [],
      interviewSessions: [],
      roleplaySessions: [],
      dailyXP: []
    })
    const p = getProfile()
    setProfile({ ...p, xp: 0, streak: 0, totalSessions: 0 })
    onProfileUpdate()
    setConfirmReset(false)
  }

  const profile = getProfile()
  const level = Math.floor((profile?.xp || 0) / 200) + 1

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-sm text-ink-400 mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile">
        <div className="flex items-center gap-3 p-3 bg-ink-50 dark:bg-ink-900/50 rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-mint flex items-center justify-center text-white font-display font-bold text-lg">
            {(profile.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-ink-700 dark:text-ink-200">{profile.name || 'Learner'}</p>
            <p className="text-xs text-ink-400">Level {level} · {profile.xp || 0} XP · {profile.streak || 0} day streak</p>
          </div>
        </div>
        <div>
          <label className="label mb-1.5 block">Display name</label>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              onKeyDown={e => e.key === 'Enter' && saveName()}
            />
            <Button onClick={saveName} variant={nameSaved ? 'secondary' : 'primary'} className="flex-shrink-0">
              {nameSaved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
            </Button>
          </div>
        </div>
      </Section>

      {/* API Key */}
      <Section title="Groq API Key">
        <p className="text-xs text-ink-400">Your key is stored only on this device and never sent to any server other than Groq.</p>
        <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-brand-500 text-xs hover:text-brand-400">
          <ExternalLink size={12} /> Get or manage your Groq key
        </a>
        <div className="relative">
          <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-10 pr-10 font-mono text-sm"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => { setApiKeyState(e.target.value); setKeyError('') }}
            placeholder="gsk_..."
          />
          <button
            onClick={() => setShowKey(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {keyError && <p className="text-red-400 text-xs">{keyError}</p>}
        <Button onClick={saveApiKey} loading={testing} variant={keySaved ? 'secondary' : 'primary'}>
          {keySaved ? <><CheckCircle size={14} /> Verified & saved</> : testing ? 'Verifying...' : <><Key size={14} /> Save API key</>}
        </Button>
      </Section>

      {/* Data */}
      <Section title="Your data">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-200">Export progress</p>
              <p className="text-xs text-ink-400">Download all your learning data as CSV</p>
            </div>
            <Button onClick={handleExport} variant="secondary" className="flex-shrink-0">
              {exported ? <CheckCircle size={14} className="text-emerald-500" /> : <Download size={14} />}
              {exported ? 'Done!' : 'Export'}
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-ink-100 dark:border-ink-700 pt-3">
            <div>
              <p className="text-sm font-medium text-red-500">Reset progress</p>
              <p className="text-xs text-ink-400">Clear all XP, streaks, and learned terms</p>
            </div>
            {!confirmReset ? (
              <Button onClick={() => setConfirmReset(true)} variant="ghost" className="text-red-400 flex-shrink-0">
                <Trash2 size={14} /> Reset
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setConfirmReset(false)} variant="ghost" className="text-xs">Cancel</Button>
                <Button onClick={resetProgress} variant="danger" className="text-xs">
                  <Trash2 size={12} /> Confirm
                </Button>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* App Info */}
      <Section title="About SpeakUp">
        <div className="space-y-2 text-sm text-ink-500 dark:text-ink-400">
          <div className="flex justify-between"><span>Version</span><span className="font-mono">1.0.0</span></div>
          <div className="flex justify-between"><span>AI model</span><span className="font-mono">llama-3.3-70b</span></div>
          <div className="flex justify-between"><span>Storage</span><span>Local device only</span></div>
          <div className="flex justify-between"><span>Terms stored</span><span className="font-mono">{(getProgress()?.jargonLearned || []).length} learned</span></div>
        </div>
      </Section>
    </div>
  )
}
