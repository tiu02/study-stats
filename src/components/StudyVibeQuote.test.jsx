import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyVibeQuote from './StudyVibeQuote'

// ── Mock helpers ──────────────────────────────────────────────────────────────

const MOCK_QUOTES = [
  { text: 'Work hard every day.', author: 'Jane Doe' },
  { text: 'Keep going forward.', author: 'John Smith' },
  { text: 'Believe in yourself.', author: 'Mary Lee' },
]

function mockFetchWith(quotes) {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve(quotes) })
  )
}

function mockFetchFail() {
  global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
}

function mockFetchPending() {
  global.fetch = vi.fn(() => new Promise(() => {})) // never resolves
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StudyVibeQuote', () => {
  // ── Loading state ──

  describe('loading state', () => {
    it('shows loading skeleton while quote is being fetched', () => {
      mockFetchPending()
      render(<StudyVibeQuote />)
      expect(screen.getByLabelText('Loading quote')).toBeInTheDocument()
    })

    it('loading skeleton has aria-busy="true"', () => {
      mockFetchPending()
      render(<StudyVibeQuote />)
      expect(screen.getByLabelText('Loading quote')).toHaveAttribute('aria-busy', 'true')
    })
  })

  // ── API success ──

  describe('API success', () => {
    it('renders quote text and author returned from the quotes Netlify function', async () => {
      mockFetchWith([{ text: 'Press on.', author: 'Calvin Coolidge' }])
      render(<StudyVibeQuote />)
      await waitFor(() => {
        expect(screen.getByText(/Press on/)).toBeInTheDocument()
        expect(screen.getByText(/Calvin Coolidge/)).toBeInTheDocument()
      })
      // Verify the frontend called the Netlify function (not an external API)
      expect(global.fetch).toHaveBeenCalledWith('/.netlify/functions/quotes')
    })
  })

  // ── API error fallback ──

  describe('API error fallback', () => {
    it('shows a fallback local quote when the API call fails', async () => {
      mockFetchFail()
      render(<StudyVibeQuote />)
      // Refresh button only renders after quote !== null (loading state resolves)
      await waitFor(() => {
        expect(screen.queryByLabelText('Loading quote')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /get new quote/i })).toBeInTheDocument()
      })
    })
  })

  // ── Refresh button ──

  describe('refresh button', () => {
    it('renders a refresh button with accessible label once quote is loaded', async () => {
      mockFetchWith(MOCK_QUOTES)
      render(<StudyVibeQuote />)
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /get new quote/i })).toBeInTheDocument()
      )
    })
  })

  // ── Caching ──

  describe('caching', () => {
    it('does not fetch when a fresh cache entry exists in localStorage', async () => {
      localStorage.setItem('study_vibe_quotes', JSON.stringify({
        quotes: [{ text: 'Cached wisdom.', author: 'Cache Author' }],
        timestamp: Date.now(),
      }))
      mockFetchWith(MOCK_QUOTES)
      render(<StudyVibeQuote />)
      await waitFor(() =>
        expect(screen.getByText(/Cached wisdom/)).toBeInTheDocument()
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('fetches fresh quotes when the cache entry is expired (>24h)', async () => {
      const EXPIRED = Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
      localStorage.setItem('study_vibe_quotes', JSON.stringify({
        quotes: [{ text: 'Stale quote.', author: 'Old Author' }],
        timestamp: EXPIRED,
      }))
      mockFetchWith([{ text: 'Fresh wisdom.', author: 'New Author' }])
      render(<StudyVibeQuote />)
      await waitFor(() =>
        expect(screen.getByText(/Fresh wisdom/)).toBeInTheDocument()
      )
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  // ── Refresh behavior ──

  describe('refresh behavior', () => {
    it('uses in-memory quotes array on refresh and does not re-fetch from API', async () => {
      // Real timers — waitFor polls until the 280ms crossfade timeout fires naturally
      mockFetchWith(MOCK_QUOTES)
      const user = userEvent.setup()
      render(<StudyVibeQuote />)

      await waitFor(() =>
        screen.getByRole('button', { name: /get new quote/i })
      )
      expect(global.fetch).toHaveBeenCalledTimes(1) // one call on load

      // Click refresh — quotesRef is populated, so no additional fetch should happen
      await user.click(screen.getByRole('button', { name: /get new quote/i }))

      // Wait for fading to complete: button is re-enabled once the 280ms timeout fires
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /get new quote/i })).not.toBeDisabled(),
        { timeout: 2000 }
      )

      expect(global.fetch).toHaveBeenCalledTimes(1) // still just the one initial call
    }, 10000)

    it('shows offline note when refresh fetch fails (quotesRef is empty after failed initial load)', async () => {
      // Initial load fails → local fallback quote shown, quotesRef stays null
      mockFetchFail()
      const user = userEvent.setup()
      render(<StudyVibeQuote />)

      await waitFor(() =>
        screen.getByRole('button', { name: /get new quote/i })
      )

      // No offline note yet (only shows after a failed refresh)
      expect(screen.queryByText(/offline quote/i)).not.toBeInTheDocument()

      // Click refresh — quotesRef is null, so it re-tries fetch which also fails
      await user.click(screen.getByRole('button', { name: /get new quote/i }))

      // waitFor polls until the offline note appears (after 280ms timeout + failed fetch)
      await waitFor(() =>
        expect(screen.getByText(/offline quote/i)).toBeInTheDocument(),
        { timeout: 2000 }
      )
    }, 10000)
  })
})
