import React, { useState, useCallback } from 'react'
import { Shuffle, Send, ChevronRight, MessageCircle, Lightbulb, RefreshCw, CheckCircle } from 'lucide-react'
import { groqChat, groqStream } from '../../utils/groq'
import { getProgress, setProgress } from '../../utils/storage'
import { Button } from '../shared/Button'
import { LoadingSpinner, XPBurst } from '../shared/UI'

const SCENARIOS = [
  { id: 'meeting', title: 'Team Meeting', emoji: '👥', desc: 'Speak up and share your ideas clearly' },
  { id: 'negotiation', title: 'Salary Negotiation', emoji: '💼', desc: 'Negotiate with confidence and data' },
  { id: 'presentation', title: 'Client Presentation', emoji: '📊', desc: 'Present your work persuasively' },
  { id: 'disagreement', title: 'Respectful Disagreement', emoji: '🤝', desc: 'Push back professionally' },
  { id: 'networking', title: 'Networking Event', emoji: '🌐', desc: 'Make memorable first impressions' },
  { id: 'feedback', title: 'Giving Feedback', emoji: '💬', desc: 'Deliver feedback that lands well' },
]

function DailyPromptSection({ onXP }) {
  const [prompt, setPrompt] = useState('')
  const [userResponse, setUserResponse] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('idle') // idle | prompt | responding | feedback | done
  const [burst, setBurst] = useState(false)

  const generatePrompt = async () => {
    setLoading(true)
    setStage('prompt')
    setFeedback('')
    setUserResponse('')
    try {
      const p = await groqChat([{
        role: 'user',
        content: `Generate one speaking challenge prompt for a professional wanting to build confidence. It should be a realistic scenario requiring them to write a brief, assertive response. Example: "Your manager asks you to take on 3 extra projects. How do you respond professionally while protecting your time?" Keep it 1-2 sentences. No numbering.`
      }], { maxTokens: 100 })
      setPrompt(p.trim())
    } catch (e) {
      setPrompt('Describe a time you had to speak up in a difficult situation. What would you say differently now with more confidence?')
    }
    setLoading(false)
  }

  const getFeedback = async () => {
    if (!userResponse.trim()) return
    setLoading(true)
    setStage('feedback')
    setFeedback('')
    try {
      await groqStream([{
        role: 'user',
        content: `You are a professional speaking coach. The user was asked: "${prompt}"
Their response: "${userResponse}"

Give feedback in this format:
**What worked:** [1-2 specific things done well]
**Improve:** [1 specific, actionable suggestion]
**Power phrase:** [one alternative phrase they could use]

Be direct, warm, and specific. Keep it under 120 words.`
      }], (chunk, full) => setFeedback(full), { maxTokens: 200 })

      // save progress
      const prog = getProgress()
      const today = new Date().toISOString().split('T')[0]
      const updated = {
        ...prog,
        completedPrompts: [...(prog.completedPrompts || []), { date: today, prompt, xp: 20 }]
      }
      setProgress(updated)
      onXP(20)
      setBurst(true)
      setStage('done')
    } catch {}
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {burst && <XPBurst amount={20} onDone={() => setBurst(false)} />}

      {stage === 'idle' && (
        <div className="card p-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h3 className="font-display font-semibold text-ink-700 dark:text-ink-200 mb-1">Daily Speaking Prompt</h3>
          <p className="text-sm text-ink-400 mb-4">Get a challenge, write your response, receive coaching feedback.</p>
          <Button onClick={generatePrompt} loading={loading} className="mx-auto">
            <Shuffle size={15} /> Get today's prompt
          </Button>
        </div>
      )}

      {stage !== 'idle' && (
        <div className="card p-5 space-y-4">
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 border border-brand-200 dark:border-brand-800">
            <p className="label text-brand-500 mb-2">Your prompt</p>
            {loading && !prompt ? <LoadingSpinner size={20} className="mx-auto" /> :
              <p className="text-ink-700 dark:text-ink-200 font-medium leading-relaxed">{prompt}</p>
            }
          </div>

          {prompt && stage !== 'done' && (
            <>
              <textarea
                className="input min-h-[120px] resize-none"
                placeholder="Write your response here... be assertive, be clear."
                value={userResponse}
                onChange={e => setUserResponse(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={generatePrompt} variant="secondary" loading={loading}>
                  <RefreshCw size={14} /> New prompt
                </Button>
                <Button onClick={getFeedback} loading={loading} disabled={!userResponse.trim()}>
                  <Send size={14} /> Get feedback
                </Button>
              </div>
            </>
          )}

          {feedback && (
            <div className="space-y-2">
              <p className="label text-ink-400">Coach feedback</p>
              <div className="bg-ink-50 dark:bg-ink-900/50 rounded-xl p-4 text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
                {feedback}
              </div>
              {stage === 'done' && (
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                  <CheckCircle size={16} /> +20 XP earned
                </div>
              )}
            </div>
          )}

          {stage === 'done' && (
            <Button onClick={() => { setStage('idle'); setPrompt(''); setFeedback(''); setUserResponse('') }} variant="secondary">
              <Shuffle size={14} /> New prompt
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function RoleplaySection({ onXP }) {
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [burst, setBurst] = useState(false)
  const [sessionDone, setSessionDone] = useState(false)

  const startScenario = async (scenario) => {
    setSelected(scenario)
    setMessages([])
    setSessionDone(false)
    setLoading(true)
    try {
      const opening = await groqChat([{
        role: 'user',
        content: `You are a roleplay partner for a professional speaking practice app. The scenario is: "${scenario.title} - ${scenario.desc}". Start the roleplay by setting the scene briefly (1-2 sentences) and then speaking your first line as the other person in this scenario. Keep it realistic and professional. Don't break character.`
      }], { maxTokens: 150 })
      setMessages([{ role: 'assistant', content: opening.trim() }])
    } catch {}
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const exchangeCount = newMessages.filter(m => m.role === 'user').length

    try {
      const sysPrompt = exchangeCount >= 4
        ? `You are roleplaying as the other person in a "${selected.title}" scenario. This is exchange ${exchangeCount}. After your next response, naturally wrap up the conversation and add: "\n\n---\n**Coaching note:** [Give one specific piece of feedback on the user's communication style in 1-2 sentences]"`
        : `You are roleplaying as the other person in a "${selected.title}" scenario. Keep responses realistic, 2-3 sentences max. Stay in character.`

      const res = await groqChat([
        { role: 'system', content: sysPrompt },
        ...newMessages.map(m => ({ role: m.role, content: m.content }))
      ], { maxTokens: 200 })

      setMessages(prev => [...prev, { role: 'assistant', content: res.trim() }])

      if (exchangeCount >= 4) {
        const prog = getProgress()
        setProgress_({ ...prog, roleplaySessions: [...(prog.roleplaySessions || []), { date: new Date().toISOString().split('T')[0], scenario: selected.id }] })
        onXP(30)
        setBurst(true)
        setSessionDone(true)
      }
    } catch {}
    setLoading(false)
  }

  if (!selected) return (
    <div className="grid grid-cols-2 gap-3">
      {SCENARIOS.map(s => (
        <button key={s.id} onClick={() => startScenario(s)} className="card-hover p-4 text-left">
          <span className="text-2xl mb-2 block">{s.emoji}</span>
          <p className="font-medium text-sm text-ink-700 dark:text-ink-200">{s.title}</p>
          <p className="text-xs text-ink-400 mt-0.5 leading-tight">{s.desc}</p>
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      {burst && <XPBurst amount={30} onDone={() => setBurst(false)} />}
      <div className="flex items-center gap-2">
        <button onClick={() => setSelected(null)} className="btn-ghost text-sm py-1.5 px-2">← Back</button>
        <div className="flex items-center gap-2">
          <span>{selected.emoji}</span>
          <span className="font-medium text-ink-700 dark:text-ink-200 text-sm">{selected.title}</span>
        </div>
      </div>

      <div className="card p-4 space-y-3 max-h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
              m.role === 'user'
                ? 'bg-brand-500 text-white rounded-br-sm'
                : 'bg-ink-100 dark:bg-ink-700 text-ink-700 dark:text-ink-200 rounded-bl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-ink-100 dark:bg-ink-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <LoadingSpinner size={16} />
            </div>
          </div>
        )}
      </div>

      {!sessionDone ? (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Your response..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <Button onClick={sendMessage} loading={loading} disabled={!input.trim()} className="px-4">
            <Send size={15} />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
            <CheckCircle size={16} /> Session complete! +30 XP
          </div>
          <Button variant="secondary" onClick={() => setSelected(null)}>
            Try another scenario
          </Button>
        </div>
      )}
    </div>
  )
}

function PhrasingSection() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const improve = async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult('')
    try {
      await groqStream([{
        role: 'user',
        content: `You are a business communication expert. Improve this phrase/sentence to sound more confident, professional, and clear:

"${input}"

Format your response as:
**Improved:** [the improved version]
**Why it works:** [1 sentence explaining the change]
**Also try:** [one alternative version]

Keep it concise.`
      }], (_, full) => setResult(full), { maxTokens: 200 })
    } catch {}
    setLoading(false)
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="label mb-1">Phrase improver</p>
        <p className="text-xs text-ink-400">Paste something you'd say and get a more confident, professional version.</p>
      </div>
      <textarea
        className="input min-h-[80px] resize-none"
        placeholder={`e.g. "I'm not sure but maybe we could try..."`}
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <Button onClick={improve} loading={loading} disabled={!input.trim()}>
        <Lightbulb size={14} /> Improve my phrasing
      </Button>
      {result && (
        <div className="bg-ink-50 dark:bg-ink-900/50 rounded-xl p-4 text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
          {result}
        </div>
      )}
    </div>
  )
}

function ConfidenceSection() {
  const [tip, setTip] = useState('')
  const [loading, setLoading] = useState(false)

  const getTip = async () => {
    setLoading(true)
    try {
      const t = await groqChat([{
        role: 'user',
        content: `Give one specific, actionable confidence tip for someone learning to speak more assertively in professional settings. Make it practical and psychology-backed, not generic. Max 3 sentences. No bullet points.`
      }], { maxTokens: 100 })
      setTip(t.trim())
    } catch {}
    setLoading(false)
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <p className="label mb-1">Confidence booster</p>
        <p className="text-xs text-ink-400">Get a research-backed tip to build your speaking confidence.</p>
      </div>
      {tip && (
        <div className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 rounded-xl p-4 text-sm text-ink-600 dark:text-ink-300 leading-relaxed border border-brand-100 dark:border-brand-800">
          {tip}
        </div>
      )}
      <Button onClick={getTip} loading={loading} variant={tip ? 'secondary' : 'primary'}>
        <RefreshCw size={14} /> {tip ? 'New tip' : 'Get a confidence tip'}
      </Button>
    </div>
  )
}

// helper to avoid import cycle
function setProgress_(p) {
  try { localStorage.setItem('speakup_progress', JSON.stringify(p)) } catch {}
}

const SECTIONS = [
  { id: 'prompt', label: 'Daily Prompt', emoji: '🎯' },
  { id: 'roleplay', label: 'Roleplay', emoji: '🎭' },
  { id: 'phrasing', label: 'Phrasing', emoji: '✨' },
  { id: 'confidence', label: 'Mindset', emoji: '💪' },
]

export function Coach({ onXP }) {
  const [active, setActive] = useState('prompt')

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Speaking Coach</h1>
        <p className="text-sm text-ink-400 mt-0.5">Build confidence through daily practice</p>
      </div>

      {/* Section Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              active === s.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                : 'bg-white dark:bg-ink-800 text-ink-500 dark:text-ink-400 border border-ink-100 dark:border-ink-700'
            }`}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {active === 'prompt' && <DailyPromptSection onXP={onXP} />}
      {active === 'roleplay' && <RoleplaySection onXP={onXP} />}
      {active === 'phrasing' && <PhrasingSection />}
      {active === 'confidence' && <ConfidenceSection />}
    </div>
  )
}
