import { useState, useRef } from 'react'
import './StudyVibeMusic.css'

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

const MOODS = [
  { key: 'lofi',      label: 'Lo-fi',     query: 'lofi hip hop study beats popular' },
  { key: 'rnb',       label: 'R&B',       query: 'r&b soul chill study music playlist' },
  { key: 'jazz',      label: 'Jazz',      query: 'jazz café study music' },
  { key: 'piano',     label: 'Piano',     query: 'piano study music relaxing' },
  { key: 'classical', label: 'Classical', query: 'classical music focus studying' },
  { key: 'ambient',   label: 'Ambient',   query: 'ambient music deep concentration' },
  { key: 'nature',    label: 'Nature',    query: 'nature sounds study ambient' },
]

function getCachedPool(moodKey) {
  try {
    const raw = localStorage.getItem(`study_vibe_music_${moodKey}`)
    if (!raw) return null
    const { pool, timestamp } = JSON.parse(raw)
    if (!pool || !Array.isArray(pool)) return null // handles old cache format gracefully
    if (Date.now() - timestamp > CACHE_TTL) return null
    return pool
  } catch {
    return null
  }
}

function setCachedPool(moodKey, pool) {
  try {
    localStorage.setItem(
      `study_vibe_music_${moodKey}`,
      JSON.stringify({ pool, timestamp: Date.now() })
    )
  } catch {
    // localStorage blocked or full
  }
}

export default function StudyVibeMusic({ inner = false }) {
  const [activeMood, setActiveMood]     = useState(null)   // mood key or null
  const [activeSearch, setActiveSearch] = useState(null)   // submitted search string or null
  const [searchInput, setSearchInput]   = useState('')     // controlled input value
  const [pool, setPool]                   = useState([])   // full result array (up to 6)
  const [visibleResults, setVisibleResults] = useState([]) // 3 currently shown
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [activeVideo, setActiveVideo]     = useState(null)
  const searchInputRef = useRef(null)

  const canShuffle = pool.length > 3
  const hasResults = activeMood !== null || activeSearch !== null

  // Pick 3 random items from pool, preferring ones not currently visible
  function pickVisible(fullPool, current = []) {
    const currentIds = new Set(current.map(r => r.videoId))
    const others = fullPool.filter(r => !currentIds.has(r.videoId))
    const candidates = others.length >= 3 ? others : fullPool
    return [...candidates].sort(() => Math.random() - 0.5).slice(0, 3)
  }

  // ── Core fetch ──────────────────────────────────────────

  async function fetchResults(cacheKey, query) {
    // Check cache (mood results only; custom search is always fresh)
    if (cacheKey) {
      const cached = getCachedPool(cacheKey)
      if (cached) {
        setPool(cached)
        setVisibleResults(pickVisible(cached))
        setActiveVideo(null)
        return
      }
    }

    setLoading(true)
    setError(null)
    setPool([])
    setVisibleResults([])
    setActiveVideo(null)

    try {
      const res = await fetch(
        `/.netlify/functions/youtube-search?q=${encodeURIComponent(query)}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Request failed (${res.status})`)
      }
      const data = await res.json()
      const items = data.items || []
      setPool(items)
      setVisibleResults(pickVisible(items))
      if (cacheKey) setCachedPool(cacheKey, items)
    } catch (err) {
      setError(err.message || 'Could not load music')
    } finally {
      setLoading(false)
    }
  }

  // ── Mood pills ──────────────────────────────────────────

  function handleMoodSelect(mood) {
    if (activeMood === mood.key) {
      // Toggle off
      setActiveMood(null)
      setPool([])
      setVisibleResults([])
      setActiveVideo(null)
      setError(null)
      return
    }

    setActiveMood(mood.key)
    setActiveSearch(null)
    setSearchInput('')
    setError(null)
    fetchResults(mood.key, mood.query)
  }

  // ── Custom search ───────────────────────────────────────

  function handleSearchSubmit(e) {
    e.preventDefault()
    const q = searchInput.trim()
    if (!q) return
    setActiveMood(null)
    setActiveSearch(q)
    setError(null)
    fetchResults(null, q) // null cacheKey = no caching for custom search
  }

  function handleSearchClear() {
    setSearchInput('')
    setActiveSearch(null)
    setPool([])
    setVisibleResults([])
    setActiveVideo(null)
    setError(null)
    searchInputRef.current?.focus()
  }

  // ── Shuffle / retry / video ─────────────────────────────

  function handleShuffle() {
    setVisibleResults(prev => pickVisible(pool, prev))
    setActiveVideo(null)
  }

  function handleRetry() {
    if (activeMood) {
      const mood = MOODS.find(m => m.key === activeMood)
      if (mood) fetchResults(null, mood.query) // bypass cache on retry
    } else if (activeSearch) {
      fetchResults(null, activeSearch)
    }
  }

  function handleVideoSelect(videoId) {
    setActiveVideo(prev => (prev === videoId ? null : videoId))
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <div className={inner ? 'svm-inner' : 'svm-card'}>

      {/* ── Header ── */}
      <div className="svm-header">
        <div className="svm-title-group">
          <span className="material-symbols-outlined svm-icon" aria-hidden="true">
            music_note_2
          </span>
          <span className="svm-card-title">Music</span>
        </div>
        {hasResults && canShuffle && !loading && !error && (
          <button
            className="svm-shuffle-btn"
            onClick={handleShuffle}
            aria-label="Shuffle results"
            title="Shuffle results"
          >
            <span className="material-symbols-outlined" aria-hidden="true">shuffle</span>
          </button>
        )}
      </div>

      {/* ── Mood pills ── */}
      <div className="svm-moods" role="group" aria-label="Music mood">
        {MOODS.map(mood => (
          <button
            key={mood.key}
            className={`svm-mood-btn${activeMood === mood.key ? ' svm-mood-active' : ''}`}
            onClick={() => handleMoodSelect(mood)}
            disabled={loading}
            aria-pressed={activeMood === mood.key}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {/* ── Custom search ── */}
      <form className="svm-search-form" onSubmit={handleSearchSubmit} role="search">
        <div className="svm-search-wrap">
          <span className="material-symbols-outlined svm-search-icon" aria-hidden="true">
            search
          </span>
          <input
            ref={searchInputRef}
            className="svm-search-input"
            type="text"
            placeholder="Search study music…"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            aria-label="Search study music"
            maxLength={100}
          />
          {searchInput && (
            <button
              type="button"
              className="svm-search-clear"
              onClick={handleSearchClear}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="svm-search-submit"
          disabled={!searchInput.trim() || loading}
          aria-label="Search"
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </button>
      </form>

      {/* ── Results area ── */}
      {hasResults && (
        <div className="svm-results-area" aria-live="polite" aria-atomic="false">

          {/* Loading skeleton */}
          {loading && (
            <div className="svm-skeleton-list" aria-busy="true" aria-label="Loading music">
              {[0, 1, 2].map(i => (
                <div key={i} className="svm-skeleton-card">
                  <div className="svm-skeleton svm-skeleton-thumb" />
                  <div className="svm-skeleton-text">
                    <div className="svm-skeleton svm-skeleton-line" />
                    <div className="svm-skeleton svm-skeleton-line svm-skeleton-short" />
                    <div className="svm-skeleton svm-skeleton-channel" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="svm-error">
              <span className="material-symbols-outlined svm-error-icon" aria-hidden="true">
                wifi_off
              </span>
              <p className="svm-error-msg">Couldn&apos;t load music</p>
              <button className="svm-retry-btn" onClick={handleRetry}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Inline embed — shown when a video is selected */}
              {activeVideo && (
                <div className="svm-embed-wrap">
                  <iframe
                    className="svm-embed"
                    src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
                    title="Study music player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Results list */}
              {visibleResults.length > 0 && (
                <ul className="svm-results-list" aria-label="Music results">
                  {visibleResults.map(item => (
                    <li key={item.videoId}>
                      <button
                        className={`svm-result-card${activeVideo === item.videoId ? ' svm-result-active' : ''}`}
                        onClick={() => handleVideoSelect(item.videoId)}
                        aria-pressed={activeVideo === item.videoId}
                        aria-label={`${activeVideo === item.videoId ? 'Stop' : 'Play'}: ${item.title} by ${item.channelTitle}`}
                      >
                        <div className="svm-thumb-wrap">
                          <img
                            className="svm-thumb"
                            src={item.thumbnail}
                            alt=""
                            loading="lazy"
                          />
                          <span
                            className="svm-thumb-overlay material-symbols-outlined"
                            aria-hidden="true"
                          >
                            {activeVideo === item.videoId ? 'pause' : 'play_arrow'}
                          </span>
                        </div>
                        <div className="svm-result-text">
                          <span className="svm-result-title">{item.title}</span>
                          <span className="svm-result-channel">{item.channelTitle}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {visibleResults.length === 0 && (
                <p className="svm-empty">No results found</p>
              )}
            </>
          )}

        </div>
      )}

    </div>
  )
}
