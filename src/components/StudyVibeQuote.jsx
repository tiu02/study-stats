import { useState, useEffect, useRef } from 'react'
import './StudyVibeQuote.css'

const CACHE_KEY = 'study_vibe_quote'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Local pool — used as fallback when API is unavailable, and for instant refresh
const LOCAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "You are braver than you believe, stronger than you seem, and smarter than you think.", author: "A.A. Milne" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
]

function pickLocalQuote(excludeText = null) {
  const pool = excludeText
    ? LOCAL_QUOTES.filter(q => q.text !== excludeText)
    : LOCAL_QUOTES
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickApiQuote(quotes, excludeText = null) {
  const valid = quotes.filter(
    q => q.text && q.text.trim() && q.author !== 'Type.fit'
  )
  const pool = excludeText ? valid.filter(q => q.text !== excludeText) : valid
  if (!pool.length) return pickLocalQuote(excludeText)
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { text: pick.text.trim(), author: pick.author || null }
}

function getCachedQuote() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { quote, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return quote
  } catch {
    return null
  }
}

function setCachedQuote(quote) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ quote, timestamp: Date.now() }))
  } catch {
    // localStorage blocked or full
  }
}

export default function StudyVibeQuote() {
  const [quote, setQuote] = useState(null)   // null = loading
  const [refreshError, setRefreshError] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [fading, setFading] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  const quotesRef = useRef(null)  // in-memory API array
  const textRef = useRef(null)

  // ── Detect clamping (only when collapsed) ──
  useEffect(() => {
    if (expanded || !textRef.current) return
    const el = textRef.current
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [quote, expanded])

  // ── Initial load ──
  useEffect(() => {
    const cached = getCachedQuote()
    if (cached) {
      setQuote(cached)
      return
    }

    const doLoad = async () => {
      try {
        const res = await fetch('/.netlify/functions/quotes')
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        quotesRef.current = data
        const picked = pickApiQuote(data)
        setQuote(picked)
        setCachedQuote(picked)
      } catch {
        // API unavailable — use local pool silently
        const picked = pickLocalQuote()
        setQuote(picked)
        setCachedQuote(picked)
      }
    }
    doLoad()
  }, [])

  // ── Refresh — crossfade, then pick a new quote ──
  function handleRefresh() {
    if (fading) return
    setFading(true)
    setExpanded(false)

    setTimeout(() => {
      const doRefresh = async () => {
        const currentText = quote?.text ?? null
        try {
          // Use in-memory API array if available (no re-fetch needed)
          let quotes = quotesRef.current
          if (!quotes) {
            const res = await fetch('/.netlify/functions/quotes')
            if (!res.ok) throw new Error('fetch failed')
            quotes = await res.json()
            quotesRef.current = quotes
          }
          const picked = pickApiQuote(quotes, currentText)
          setQuote(picked)
          setCachedQuote(picked)
          setRefreshError(false)
        } catch {
          // API unavailable — cycle local pool so refresh always gives a new quote
          const picked = pickLocalQuote(currentText)
          setQuote(picked)
          setCachedQuote(picked)
          setRefreshError(true)
        } finally {
          setFading(false)
        }
      }
      doRefresh()
    }, 280)
  }

  // ── Loading skeleton ──
  if (quote === null) {
    return (
      <div className="svq-card svq-loading" aria-busy="true" aria-label="Loading quote">
        <div className="svq-header">
          <div className="svq-title-group">
            <div className="svq-skeleton svq-skeleton-icon-sm" />
            <div className="svq-skeleton svq-skeleton-title" />
          </div>
          <div className="svq-skeleton svq-skeleton-btn" />
        </div>
        <div className="svq-skeleton svq-skeleton-line" />
        <div className="svq-skeleton svq-skeleton-line svq-skeleton-mid" />
        <div className="svq-skeleton svq-skeleton-line svq-skeleton-short" />
        <div className="svq-skeleton svq-skeleton-author" />
      </div>
    )
  }

  return (
    <div className="svq-card">
      {/* Card header: heading + refresh button */}
      <div className="svq-header">
        <div className="svq-title-group">
          <span className="material-symbols-outlined svq-music-icon" aria-hidden="true">
            music_note_2
          </span>
          <span className="svq-card-title">Study Vibe</span>
        </div>
        <button
          className="svq-refresh-btn"
          onClick={handleRefresh}
          aria-label="Get new quote"
          disabled={fading}
        >
          <span
            className={`material-symbols-outlined${fading ? ' svq-spinning' : ''}`}
            aria-hidden="true"
          >
            refresh
          </span>
        </button>
      </div>

      {/* Quote content */}
      <div aria-live="polite" aria-atomic="true">
        <blockquote className={`svq-quote-wrap${fading ? ' svq-fading' : ''}`}>
          <p
            ref={textRef}
            className={`svq-text${expanded ? '' : ' svq-clamped'}`}
          >
            &ldquo;{quote.text}&rdquo;
          </p>

          {(quote.author || isClamped) && (
            <div className="svq-meta-row">
              {quote.author
                ? <cite className="svq-author">— {quote.author}</cite>
                : <span />
              }
              {isClamped && (
                <button
                  className="svq-toggle"
                  onClick={() => setExpanded(e => !e)}
                  aria-expanded={expanded}
                >
                  {expanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </blockquote>
      </div>

      {refreshError && (
        <p className="svq-error-note">Showing offline quote</p>
      )}
    </div>
  )
}
