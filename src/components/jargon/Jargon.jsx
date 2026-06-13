import React, { useState, useMemo } from 'react'
import { Search, CheckCircle, BookOpen, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { JARGON, CATEGORIES, CATEGORY_COLORS } from '../../data/jargon'
import { getProgress, setProgress } from '../../utils/storage'
import { groqChat } from '../../utils/groq'
import { Badge, XPBurst, EmptyState } from '../shared/UI'
import { Button } from '../shared/Button'

function JargonCard({ term, isLearned, onMarkLearned, onUnmark }) {
  const [expanded, setExpanded] = useState(false)
  const [aiExample, setAiExample] = useState('')
  const [loadingEx, setLoadingEx] = useState(false)

  const getAiExample = async (e) => {
    e.stopPropagation()
    setLoadingEx(true)
    try {
      const ex = await groqChat([{
        role: 'user',
        content: `Give one realistic, natural-sounding example sentence using the business term "${term.term}" in a professional workplace context. Just the sentence, no labels or explanation.`
      }], { maxTokens: 80 })
      setAiExample(ex.trim().replace(/^["']|["']$/g, ''))
    } catch {}
    setLoadingEx(false)
  }

  const diffColors = {
    beginner: 'green',
    intermediate: 'gold',
    advanced: 'red',
  }

  return (
    <div className={`card overflow-hidden transition-all duration-200 ${isLearned ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
      <button
        className="w-full p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`badge ${CATEGORY_COLORS[term.category]}`}>{term.category}</span>
              <Badge color={diffColors[term.difficulty]}>{term.difficulty}</Badge>
              {isLearned && <span className="text-emerald-500 text-xs flex items-center gap-0.5"><CheckCircle size={11} /> learned</span>}
            </div>
            <p className="font-display font-semibold text-ink-800 dark:text-ink-50">{term.term}</p>
            {!expanded && <p className="text-xs text-ink-400 mt-0.5 line-clamp-1">{term.definition}</p>}
          </div>
          {expanded ? <ChevronUp size={16} className="text-ink-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-ink-400 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-ink-100 dark:border-ink-700 pt-3 animate-fade-in">
          <div>
            <p className="label mb-1">Definition</p>
            <p className="text-sm text-ink-600 dark:text-ink-300">{term.definition}</p>
          </div>
          <div>
            <p className="label mb-1">Example</p>
            <p className="text-sm text-ink-600 dark:text-ink-300 italic">{term.example}</p>
          </div>
          {aiExample && (
            <div className="bg-brand-50 dark:bg-brand-900/20 rounded-lg p-3">
              <p className="label mb-1 text-brand-500">AI example</p>
              <p className="text-sm text-ink-600 dark:text-ink-300 italic">"{aiExample}"</p>
            </div>
          )}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
            <p className="label mb-1 text-amber-600 dark:text-amber-400">Pro tip</p>
            <p className="text-xs text-ink-600 dark:text-ink-300">{term.tip}</p>
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={getAiExample} loading={loadingEx} variant="ghost" className="text-xs py-1.5">
              <Zap size={12} /> AI example
            </Button>
            {isLearned ? (
              <Button onClick={() => onUnmark(term.id)} variant="ghost" className="text-xs py-1.5 text-ink-400">
                Unmark learned
              </Button>
            ) : (
              <Button onClick={() => onMarkLearned(term)} variant="primary" className="text-xs py-1.5 ml-auto">
                <CheckCircle size={12} /> Mark as learned
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function QuizMode({ learnedIds, onXP }) {
  const learned = JARGON.filter(j => learnedIds.includes(j.id))
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [burst, setBurst] = useState(false)

  if (learned.length < 4) return (
    <EmptyState
      icon={BookOpen}
      title="Not enough terms yet"
      description="Mark at least 4 terms as learned to unlock quiz mode."
    />
  )

  const questions = useMemo(() => {
    return learned.slice(0, 6).map(term => {
      const wrong = JARGON.filter(j => j.id !== term.id).sort(() => Math.random() - 0.5).slice(0, 3)
      const options = [...wrong, term].sort(() => Math.random() - 0.5)
      return { term, options }
    })
  }, [learned.length])

  const q = questions[current]
  const isLast = current === questions.length - 1

  const choose = (option) => {
    if (selected) return
    setSelected(option.id)
    if (option.id === q.term.id) setScore(s => s + 1)
  }

  const next = () => {
    if (isLast) {
      const xp = score * 10
      onXP(xp)
      setBurst(true)
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  if (done) return (
    <div className="card p-6 text-center space-y-4">
      {burst && <XPBurst amount={score * 10} onDone={() => setBurst(false)} />}
      <div className="text-4xl">{score >= 5 ? '🏆' : score >= 3 ? '🎯' : '📚'}</div>
      <div>
        <p className="font-display text-3xl font-bold text-brand-500">{score}/{questions.length}</p>
        <p className="text-ink-400 text-sm mt-1">+{score * 10} XP earned</p>
      </div>
      <Button onClick={() => { setCurrent(0); setSelected(null); setScore(0); setDone(false) }} className="mx-auto">
        Play again
      </Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="label">{current + 1} / {questions.length}</span>
        <span className="text-sm font-medium text-brand-500">{score} correct</span>
      </div>

      <div className="card p-5">
        <p className="label mb-3">What does this term mean?</p>
        <p className="font-display text-xl font-bold text-ink-800 dark:text-ink-50 mb-4">{q.term.term}</p>

        <div className="space-y-2">
          {q.options.map(opt => {
            let style = 'border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-800'
            if (selected) {
              if (opt.id === q.term.id) style = 'border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              else if (opt.id === selected) style = 'border-2 border-red-400 bg-red-50 dark:bg-red-900/20'
            }
            return (
              <button
                key={opt.id}
                onClick={() => choose(opt)}
                className={`w-full text-left p-3 rounded-xl text-sm transition-all ${style} ${!selected ? 'hover:border-brand-400 cursor-pointer' : 'cursor-default'}`}
              >
                {opt.definition}
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <Button onClick={next} className="w-full justify-center">
          {isLast ? 'See results' : 'Next question'}
        </Button>
      )}
    </div>
  )
}

export function Jargon({ onXP }) {
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('learn') // learn | quiz
  const [burst, setBurst] = useState(null)
  const [learnedIds, setLearnedIds] = useState(() => {
    const prog = getProgress()
    return (prog.jargonLearned || []).map(j => j.id)
  })

  const filtered = useMemo(() => JARGON.filter(j => {
    const matchCat = category === 'All' || j.category === category
    const matchSearch = !search || j.term.toLowerCase().includes(search.toLowerCase()) || j.definition.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [category, search])

  const markLearned = (term) => {
    if (learnedIds.includes(term.id)) return
    const prog = getProgress()
    const today = new Date().toISOString().split('T')[0]
    const updated = {
      ...prog,
      jargonLearned: [...(prog.jargonLearned || []), { id: term.id, term: term.term, category: term.category, date: today }]
    }
    setProgress(updated)
    setLearnedIds(ids => [...ids, term.id])
    onXP(15)
    setBurst(term.id)
    setTimeout(() => setBurst(null), 2000)
  }

  const unmark = (id) => {
    const prog = getProgress()
    const updated = { ...prog, jargonLearned: (prog.jargonLearned || []).filter(j => j.id !== id) }
    setProgress(updated)
    setLearnedIds(ids => ids.filter(i => i !== id))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {burst && <XPBurst amount={15} onDone={() => setBurst(null)} />}

      <div>
        <h1 className="section-title">Business Jargon</h1>
        <p className="text-sm text-ink-400 mt-0.5">{learnedIds.length} of {JARGON.length} terms learned</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-ink-100 dark:bg-ink-800 p-1 rounded-xl">
        {[{ id: 'learn', label: '📖 Learn' }, { id: 'quiz', label: '⚡ Quiz' }].map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.id ? 'bg-white dark:bg-ink-700 shadow text-ink-800 dark:text-ink-100' : 'text-ink-500'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'learn' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input className="input pl-10" placeholder="Search terms..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat
                    ? 'bg-brand-500 text-white'
                    : 'bg-white dark:bg-ink-800 text-ink-500 dark:text-ink-400 border border-ink-100 dark:border-ink-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Terms List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-center text-ink-400 py-8 text-sm">No terms match your search.</p>
            ) : filtered.map(term => (
              <JargonCard
                key={term.id}
                term={term}
                isLearned={learnedIds.includes(term.id)}
                onMarkLearned={markLearned}
                onUnmark={unmark}
              />
            ))}
          </div>
        </>
      )}

      {mode === 'quiz' && <QuizMode learnedIds={learnedIds} onXP={onXP} />}
    </div>
  )
}
