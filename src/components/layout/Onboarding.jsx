import React, { useState } from 'react'
import { Key, ArrowRight, ExternalLink, Mic, BookOpen, TrendingUp } from 'lucide-react'
import { setApiKey, setProfile, getProfile } from '../../utils/storage'
import { Button } from '../shared/Button'

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0) // 0 = welcome, 1 = name, 2 = api key
  const [name, setName] = useState('')
  const [apiKey, setApiKeyState] = useState('')
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  const handleSaveKey = async () => {
    if (!apiKey.trim().startsWith('gsk_')) {
      setError('Groq API keys start with "gsk_". Please check and try again.')
      return
    }
    setTesting(true)
    setError('')
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      })
      if (!res.ok) throw new Error('Invalid key')
      setApiKey(apiKey.trim())
      const p = getProfile()
      setProfile({ ...p, name: name.trim() || 'Learner', lastActiveDate: new Date().toISOString().split('T')[0], streak: 1 })
      onComplete()
    } catch {
      setError('Could not verify the API key. Please double-check it and try again.')
    } finally {
      setTesting(false)
    }
  }

  const features = [
    { icon: Mic, title: 'AI Speaking Coach', desc: 'Daily prompts, roleplay & real feedback' },
    { icon: BookOpen, title: 'Business Jargon', desc: '30+ terms across 4 professional categories' },
    { icon: TrendingUp, title: 'Interview Practice', desc: 'Speak your answers, get scored & coached' },
  ]

  if (step === 0) return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-accent-mint flex items-center justify-center mb-6 shadow-2xl shadow-brand-500/40">
        <span className="text-white text-3xl font-display font-bold">S</span>
      </div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">SpeakUp</h1>
      <p className="text-ink-400 mb-10">Your AI-powered speaking coach & business English trainer</p>

      <div className="w-full max-w-sm space-y-3 mb-10">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 bg-ink-800 rounded-2xl p-4 text-left">
            <div className="w-10 h-10 rounded-xl bg-brand-900/60 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-brand-400" />
            </div>
            <div>
              <p className="font-medium text-white text-sm">{title}</p>
              <p className="text-xs text-ink-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => setStep(1)} className="w-full max-w-sm justify-center">
        Get started <ArrowRight size={16} />
      </Button>
    </div>
  )

  if (step === 1) return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="label text-brand-400 mb-2">Step 1 of 2</p>
          <h2 className="font-display text-2xl font-bold text-white">What should we call you?</h2>
          <p className="text-ink-400 mt-1 text-sm">This personalises your coaching experience.</p>
        </div>
        <input
          className="input mb-4 text-white bg-ink-800 border-ink-700"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setStep(2)}
          autoFocus
        />
        <Button onClick={() => setStep(2)} className="w-full justify-center">
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="label text-brand-400 mb-2">Step 2 of 2</p>
          <h2 className="font-display text-2xl font-bold text-white">Connect your Groq key</h2>
          <p className="text-ink-400 mt-1 text-sm">SpeakUp uses Groq's fast AI to power coaching. Your key is stored only on this device.</p>
        </div>

        <a
          href="https://console.groq.com/keys"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-brand-400 text-sm mb-5 hover:text-brand-300"
        >
          <ExternalLink size={14} /> Get your free Groq API key
        </a>

        <div className="relative mb-3">
          <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="input pl-10 text-white bg-ink-800 border-ink-700 font-mono text-sm"
            placeholder="gsk_..."
            value={apiKey}
            onChange={e => { setApiKeyState(e.target.value); setError('') }}
            type="password"
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        <Button onClick={handleSaveKey} loading={testing} className="w-full justify-center">
          {testing ? 'Verifying...' : 'Start coaching'} {!testing && <ArrowRight size={16} />}
        </Button>
        <p className="text-ink-500 text-xs text-center mt-3">Your key is saved locally and never leaves this device.</p>
      </div>
    </div>
  )
}
