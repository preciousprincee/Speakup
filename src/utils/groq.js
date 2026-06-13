import { getApiKey } from './storage'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function groqChat(messages, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      ...options.extra
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function groqStream(messages, onChunk, options = {}) {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('NO_API_KEY')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true
    })
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]')
    for (const line of lines) {
      try {
        const chunk = JSON.parse(line.slice(6))
        const text = chunk.choices[0]?.delta?.content || ''
        full += text
        onChunk(text, full)
      } catch {}
    }
  }
  return full
}
