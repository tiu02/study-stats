import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyVibeMusic from './StudyVibeMusic'

// ── Mock helpers ──────────────────────────────────────────────────────────────

const MOCK_ITEMS_3 = [
  { videoId: 'v1', title: 'Lo-fi Beats Vol 1', channelTitle: 'Chill Vibes', thumbnail: 'https://img.youtube.com/vi/v1/mqdefault.jpg' },
  { videoId: 'v2', title: 'Study Jazz Mix',    channelTitle: 'Jazz Café',   thumbnail: 'https://img.youtube.com/vi/v2/mqdefault.jpg' },
  { videoId: 'v3', title: 'Piano Focus Flow',  channelTitle: 'Piano Works', thumbnail: 'https://img.youtube.com/vi/v3/mqdefault.jpg' },
]

const MOCK_ITEMS_6 = [
  ...MOCK_ITEMS_3,
  { videoId: 'v4', title: 'Ambient Space',   channelTitle: 'Ambient Zone',  thumbnail: 'https://img.youtube.com/vi/v4/mqdefault.jpg' },
  { videoId: 'v5', title: 'Classical Study', channelTitle: 'Classic Music', thumbnail: 'https://img.youtube.com/vi/v5/mqdefault.jpg' },
  { videoId: 'v6', title: 'Nature Sounds',   channelTitle: 'Nature Audio',  thumbnail: 'https://img.youtube.com/vi/v6/mqdefault.jpg' },
]

function mockFetchSuccess(items = MOCK_ITEMS_3) {
  global.fetch = vi.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ items }) })
  )
}

function mockFetchError() {
  global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StudyVibeMusic', () => {

  // ── Mood buttons ──

  describe('mood buttons', () => {
    it('renders all 7 mood preset buttons', () => {
      render(<StudyVibeMusic />)
      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      const buttons = within(moodGroup).getAllByRole('button')
      expect(buttons).toHaveLength(7)
      const labels = buttons.map(b => b.textContent.trim())
      expect(labels).toContain('Lo-fi')
      expect(labels).toContain('R&B')
      expect(labels).toContain('Jazz')
      expect(labels).toContain('Piano')
      expect(labels).toContain('Classical')
      expect(labels).toContain('Ambient')
      expect(labels).toContain('Nature')
    })

    it('does not show results area before a mood or search is selected', () => {
      render(<StudyVibeMusic />)
      expect(screen.queryByLabelText('Loading music')).not.toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Music results' })).not.toBeInTheDocument()
    })
  })

  // ── Fetch on mood select ──

  describe('mood selection triggers fetch', () => {
    it('calls the youtube-search Netlify function when a mood is selected', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Lo-fi' }))

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/.netlify/functions/youtube-search')
      )
    })

    it('displays video titles and thumbnails after fetch succeeds', async () => {
      mockFetchSuccess(MOCK_ITEMS_3)
      const user = userEvent.setup()
      const { container } = render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Lo-fi' }))

      await waitFor(() =>
        expect(screen.getByRole('list', { name: 'Music results' })).toBeInTheDocument()
      )
      // Title text visible
      expect(screen.getByText('Lo-fi Beats Vol 1')).toBeInTheDocument()
      // Thumbnail images rendered
      const thumbs = container.querySelectorAll('.svm-thumb')
      expect(thumbs.length).toBeGreaterThan(0)
      expect(thumbs[0]).toHaveAttribute('src')
    })
  })

  // ── Error state ──

  describe('error state', () => {
    it('shows friendly error message when the fetch fails', async () => {
      mockFetchError()
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Jazz' }))

      await waitFor(() =>
        expect(screen.getByText(/couldn.t load music/i)).toBeInTheDocument()
      )
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    })

    it('retry button triggers a new fetch after an error', async () => {
      mockFetchError()
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Jazz' }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      )
      await user.click(screen.getByRole('button', { name: /try again/i }))
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  // ── Caching ──

  describe('caching', () => {
    it('serves mood results from localStorage cache without fetching', async () => {
      localStorage.setItem('study_vibe_music_lofi', JSON.stringify({
        pool: MOCK_ITEMS_3,
        timestamp: Date.now(),
      }))
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Lo-fi' }))

      await waitFor(() =>
        expect(screen.getByRole('list', { name: 'Music results' })).toBeInTheDocument()
      )
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  // ── Custom search ──

  describe('custom search', () => {
    it('calls the Netlify function with the encoded search term on form submit', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const searchInput = screen.getByRole('textbox', { name: /search study music/i })
      await user.type(searchInput, 'focus music')
      await user.click(screen.getByRole('button', { name: /^search$/i }))

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('focus%20music')
      )
    })
  })

  // ── Video embed ──

  describe('video embed', () => {
    it('embeds a YouTube iframe when a result card is clicked', async () => {
      mockFetchSuccess(MOCK_ITEMS_3)
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Lo-fi' }))

      await waitFor(() =>
        screen.getByRole('list', { name: 'Music results' })
      )
      const playButtons = screen.getAllByRole('button', { name: /^play:/i })
      await user.click(playButtons[0])

      expect(screen.getByTitle('Study music player')).toBeInTheDocument()
    })
  })

  // ── Shuffle button ──

  describe('shuffle button', () => {
    it('shows shuffle button when the pool has more than 3 results', async () => {
      mockFetchSuccess(MOCK_ITEMS_6)
      const user = userEvent.setup()
      render(<StudyVibeMusic />)

      const moodGroup = screen.getByRole('group', { name: 'Music mood' })
      await user.click(within(moodGroup).getByRole('button', { name: 'Lo-fi' }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /shuffle results/i })).toBeInTheDocument()
      )
    })
  })
})
