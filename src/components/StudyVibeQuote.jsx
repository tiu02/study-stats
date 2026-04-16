import { useState, useEffect, useRef } from 'react'
import './StudyVibeQuote.css'

const CACHE_KEY = 'study_vibe_quotes'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Local pool — used as fallback when API is unavailable
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
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "What we know is a drop, what we don't know is an ocean.", author: "Isaac Newton" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
  { text: "Knowing is not enough; we must apply. Willing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
  { text: "I have no special talents. I am only passionately curious.", author: "Albert Einstein" },
  { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
  { text: "Try not to become a man of success. Rather become a man of value.", author: "Albert Einstein" },
]

function pickLocalQuote(excludeText = null) {
  const pool = excludeText
    ? LOCAL_QUOTES.filter(q => q.text !== excludeText)
    : LOCAL_QUOTES
  return pool[Math.floor(Math.random() * pool.length)]
}

function pickApiQuote(quotes, excludeText = null) {
  const valid = quotes.filter(q => q.text?.trim())
  const pool = excludeText ? valid.filter(q => q.text !== excludeText) : valid
  if (!pool.length) return pickLocalQuote(excludeText)
  const pick = pool[Math.floor(Math.random() * pool.length)]
  return { text: pick.text.trim(), author: pick.author || null }
}

function getCachedQuotes() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { quotes, timestamp } = JSON.parse(raw)
    if (!quotes || !Array.isArray(quotes)) return null
    if (Date.now() - timestamp > CACHE_TTL) return null
    return quotes
  } catch {
    return null
  }
}

function setCachedQuotes(quotes) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ quotes, timestamp: Date.now() }))
  } catch {
    // localStorage blocked or full
  }
}

export default function StudyVibeQuote({ inner = false }) {
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
    const cached = getCachedQuotes()
    if (cached) {
      quotesRef.current = cached
      setQuote(pickApiQuote(cached))
      return
    }

    const doLoad = async () => {
      try {
        const res = await fetch('/.netlify/functions/quotes')
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        quotesRef.current = data
        setCachedQuotes(data)
        setQuote(pickApiQuote(data))
      } catch {
        // API unavailable — use local pool silently
        setQuote(pickLocalQuote())
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
            setCachedQuotes(quotes)
          }
          setQuote(pickApiQuote(quotes, currentText))
          setRefreshError(false)
        } catch {
          // API unavailable — cycle local pool so refresh always gives a new quote
          setQuote(pickLocalQuote(currentText))
          setRefreshError(true)
        } finally {
          setFading(false)
        }
      }
      doRefresh()
    }, 280)
  }

  const cls = inner ? 'svq-inner' : 'svq-card'

  // ── Loading skeleton ──
  if (quote === null) {
    return (
      <div className={`${cls} svq-loading`} aria-busy="true" aria-label="Loading quote">
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
    <div className={cls}>
      {/* Card header: heading + refresh button */}
      <div className="svq-header">
        <div className="svq-title-group">
          <span className="material-symbols-outlined svq-music-icon" aria-hidden="true">
            star_shine
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
        <p className="svq-error-note" role="status">Showing offline quote</p>
      )}
    </div>
  )
}
