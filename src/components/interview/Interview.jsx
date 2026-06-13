import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Send, Trophy, RotateCcw, Briefcase, CheckCircle, AlertCircle } from 'lucide-react'
import { groqChat, groqStream } from '../../utils/groq'
import { getProgress, setProgress } from '../../utils/storage'
import { Button } from '../shared/Button'
import { ProgressBar, LoadingSpinner, XPBurst } from '../shared/UI'

const SAMPLE_ROLES = [
  'Product Manager at a tech startup',
  'Software Engineer at a FAANG company',
  'Marketing Manager at a consumer brand',
  'Data Analyst at a financial firm',
  'UX Designer at an agency',
  'Business Development Manager',
]

function ScoreCard({ score, feedback, sessionData, onRestart }) {
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-400'
  const emoji = score >= 80 ? '🏆' : score >= 60 ? '🎯' : '📈'

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Score Hero */}
      <div className="card p-6 text-center bg-gradient-to-br from-brand-600 to-brand-800 border-brand-700">
        <div className="text-4xl mb-2">{emoji}</div>
        <p className="text-brand-300 text-sm mb-1">Interview Score</p>
        <p className={`font-display text-5xl font-bold text-white`}>{score}<span className="text-2xl text-brand-300">%</span></p>
        <p className="text-brand-300 text-sm mt-2">{sessionData.jobRole}</p>
      </div>

      {/* Question Breakdown */}
      <div className="card p-4">
        <p className="label mb-3">Per-question breakdown</p>
        <div className="space-y-3">
          {sessionData.answers.map((a, i) => (
            <div key={i} className="border-b border-ink-100 dark:border-ink-700 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-medium text-ink-600 dark:text-ink-300 flex-1">Q{i + 1}: {a.question.substring(0, 70)}...</p>
                <span className={`text-xs font-bold flex-shrink-0 ${a.score >= 80 ? 'text-emerald-500' : a.score >= 60 ? 'text-amber-500' : 'text-red-400'}`}>{a.score}%</span>
              </div>
              <ProgressBar value={a.score} size="sm" color={a.score >= 70 ? 'green' : 'gold'} />
            </div>
          ))}
        </div>
      </div>

      {/* AI Feedback */}
      <div className="card p-4">
        <p className="label mb-3">Coach's feedback</p>
        <div className="text-sm text-ink-600 dark:text-ink-300 leading-relaxed whitespace-pre-line">
          {feedback}
        </div>
      </div>

      <Button onClick={onRestart} variant="secondary" className="w-full justify-center">
        <RotateCcw size={14} /> New interview
      </Button>
    </div>
  )
}

function SpeechTranscriber({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(true)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setSupported(false); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setTranscript(text)
      onTranscript(text)
    }

    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
  }, [onTranscript])

  const toggle = () => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      setTranscript('')
      recognitionRef.current.start()
      setListening(true)
    }
  }

  if (!supported) return null

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
        listening
          ? 'bg-red-500 text-white animate-pulse-slow'
          : 'bg-ink-100 dark:bg-ink-700 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-600'
      } disabled:opacity-50`}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
      {listening ? 'Stop speaking' : 'Speak answer'}
    </button>
  )
}

export function Interview({ onXP }) {
  const [stage, setStage] = useState('setup') // setup | session | results
  const [jobRole, setJobRole] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [burst, setBurst] = useState(false)

  const startInterview = async () => {
    if (!jobRole.trim()) return
    setLoading(true)
    try {
      const raw = await groqChat([{
        role: 'user',
        content: `Generate exactly 5 realistic interview questions for a "${jobRole}" position. Mix behavioral (STAR method), situational, and role-specific technical questions. Return ONLY a JSON array of strings. No markdown, no explanation. Example: ["Question 1?", "Question 2?"]`
      }], { maxTokens: 400 })

      const clean = raw.replace(/```json|```/g, '').trim()
      const qs = JSON.parse(clean)
      setQuestions(qs)
      setCurrentQ(0)
      setAnswers([])
      setStage('session')
    } catch (e) {
      // fallback questions
      setQuestions([
        `Tell me about yourself and why you're interested in this ${jobRole} role.`,
        'Describe a challenging project you led. What was your approach?',
        'How do you handle disagreements with teammates or stakeholders?',
        'What's your biggest professional achievement in the last year?',
        'Where do you see yourself in 3 years and how does this role help you get there?',
      ])
      setCurrentQ(0)
      setAnswers([])
      setStage('session')
    }
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    setLoading(true)

    try {
      const scoreRaw = await groqChat([{
        role: 'user',
        content: `You are an interviewer for a "${jobRole}" position. Score this interview answer:

Question: "${questions[currentQ]}"
Answer: "${answer}"

Return ONLY a JSON object: {"score": <number 0-100>, "brief": "<one sentence feedback>"}
No markdown, no explanation.`
      }], { maxTokens: 100 })

      let qScore = 70
      let brief = 'Good response.'
      try {
        const parsed = JSON.parse(scoreRaw.replace(/```json|```/g, '').trim())
        qScore = parsed.score || 70
        brief = parsed.brief || brief
      } catch {}

      const newAnswers = [...answers, { question: questions[currentQ], answer, score: qScore, brief }]
      setAnswers(newAnswers)
      setAnswer('')

      if (currentQ + 1 >= questions.length) {
        // generate final results
        await generateResults(newAnswers)
      } else {
        setCurrentQ(q => q + 1)
      }
    } catch {}
    setLoading(false)
  }

  const generateResults = async (allAnswers) => {
    setLoading(true)
    setStage('results')

    const avgScore = Math.round(allAnswers.reduce((s, a) => s + a.score, 0) / allAnswers.length)
    setScore(avgScore)

    const xpEarned = Math.round(avgScore / 10) * 10
    onXP(xpEarned)
    setBurst(true)

    try {
      const fb = await groqChat([{
        role: 'user',
        content: `You are a professional interview coach. The candidate interviewed for: "${jobRole}". 

Their Q&A:
${allAnswers.map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}\nScore: ${a.score}%`).join('\n\n')}

Write a coaching summary covering:
1. Top strength (specific to their answers)
2. Main area to improve (with concrete advice)
3. One power phrase or technique they should practice

Be direct, encouraging, and specific. Under 150 words.`
      }], { maxTokens: 300 })
      setFeedback(fb.trim())
    } catch {
      setFeedback('Great effort completing the interview! Review your answers and practice the questions where you scored lower.')
    }

    // Save session
    const prog = getProgress()
    const today = new Date().toISOString().split('T')[0]
    const updated = {
      ...prog,
      interviewSessions: [...(prog.interviewSessions || []), {
        date: today,
        jobRole,
        score: avgScore,
        questionsAnswered: allAnswers.length
      }]
    }
    setProgress(updated)
    setLoading(false)
  }

  const handleTranscript = useCallback((text) => setAnswer(text), [])

  const restart = () => {
    setStage('setup')
    setJobRole('')
    setQuestions([])
    setAnswers([])
    setCurrentQ(0)
    setAnswer('')
    setScore(0)
    setFeedback('')
  }

  if (stage === 'results') return (
    <div className="animate-fade-in">
      {burst && <XPBurst amount={Math.round(score / 10) * 10} onDone={() => setBurst(false)} />}
      {loading ? (
        <div className="flex flex-col items-center py-20 gap-4">
          <LoadingSpinner size={32} />
          <p className="text-ink-400 text-sm">Generating your feedback...</p>
        </div>
      ) : (
        <ScoreCard
          score={score}
          feedback={feedback}
          sessionData={{ jobRole, answers }}
          onRestart={restart}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="section-title">Interview Practice</h1>
        <p className="text-sm text-ink-400 mt-0.5">Speak or type your answers — get scored & coached</p>
      </div>

      {stage === 'setup' && (
        <div className="space-y-5">
          <div className="card p-5">
            <p className="label mb-2">Job role</p>
            <input
              className="input mb-3"
              placeholder="e.g. Product Manager at a fintech startup"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startInterview()}
            />
            <p className="text-xs text-ink-400 mb-3">Or pick one:</p>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setJobRole(r)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    jobRole === r
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'border-ink-200 dark:border-ink-700 text-ink-500 hover:border-brand-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <p className="label">How it works</p>
            {[
              { n: '1', t: 'Define your job role', d: 'The more specific, the better the questions' },
              { n: '2', t: 'Answer 5 questions', d: 'Speak aloud or type — your choice' },
              { n: '3', t: 'Get scored & coached', d: 'Receive a score and actionable feedback' },
            ].map(step => (
              <div key={step.n} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{step.n}</div>
                <div>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{step.t}</p>
                  <p className="text-xs text-ink-400">{step.d}</p>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={startInterview} loading={loading} disabled={!jobRole.trim()} className="w-full justify-center">
            <Briefcase size={16} /> Start interview
          </Button>
        </div>
      )}

      {stage === 'session' && (
        <div className="space-y-4">
          {/* Progress */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="label">Question {currentQ + 1} of {questions.length}</span>
              <span className="text-xs text-ink-400">{jobRole.substring(0, 30)}{jobRole.length > 30 ? '...' : ''}</span>
            </div>
            <ProgressBar value={currentQ} max={questions.length} />
          </div>

          {/* Question */}
          <div className="card p-5 bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/10 border-brand-200 dark:border-brand-800">
            <p className="label text-brand-500 mb-2">Interviewer asks:</p>
            <p className="font-medium text-ink-700 dark:text-ink-200 leading-relaxed">{questions[currentQ]}</p>
          </div>

          {/* Previous answers summary */}
          {answers.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {answers.map((a, i) => (
                <div key={i} className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  a.score >= 70 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                }`}>
                  {a.score >= 70 ? <CheckCircle size={11} /> : <AlertCircle size={11} />} Q{i + 1}: {a.score}%
                </div>
              ))}
            </div>
          )}

          {/* Answer Input */}
          <div className="card p-4 space-y-3">
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="Type your answer here, or use the microphone button below to speak..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
            />
            <div className="flex gap-2 items-center">
              <SpeechTranscriber onTranscript={handleTranscript} disabled={loading} />
              <Button
                onClick={submitAnswer}
                loading={loading}
                disabled={!answer.trim()}
                className="ml-auto"
              >
                <Send size={14} />
                {currentQ + 1 === questions.length ? 'Finish' : 'Next question'}
              </Button>
            </div>
            <p className="text-xs text-ink-400">💡 Use the STAR method: Situation, Task, Action, Result</p>
          </div>
        </div>
      )}
    </div>
  )
}
