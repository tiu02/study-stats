import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sessions from './Sessions'

/* ── Mocks ── */

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ currentUser: { uid: 'u1' } })),
}))

const mockAdd = vi.fn(() => Promise.resolve({ ok: true }))
const mockUpdate = vi.fn(() => Promise.resolve({ ok: true }))
const mockRemove = vi.fn(() => Promise.resolve({ ok: true }))
const mockRefresh = vi.fn()

let mockSessions = []

vi.mock('../hooks/useFirestore', () => ({
  useSessions: vi.fn(() => ({
    sessions: mockSessions,
    loading: false,
    error: null,
    add: mockAdd,
    update: mockUpdate,
    remove: mockRemove,
    refresh: mockRefresh,
  })),
}))

/* ── Test data ── */

const SESSIONS = [
  { id: '1', subject: 'Mathematics', color: '#6366F1', status: 'complete', duration: 60, date: new Date('2026-03-20T12:00:00'), notes: '' },
  { id: '2', subject: 'Mathematics', color: '#6366F1', status: 'in-progress', duration: 45, date: new Date('2026-03-22T12:00:00'), notes: '' },
  { id: '3', subject: 'Physics', color: '#2563EB', status: 'complete', duration: 30, date: new Date('2026-03-24T12:00:00'), notes: '' },
  { id: '4', subject: 'Physics', color: '#2563EB', status: 'incomplete', duration: 20, date: new Date('2026-03-25T12:00:00'), notes: '' },
  { id: '5', subject: 'History', color: '#A855F7', status: 'complete', duration: 90, date: new Date('2026-03-18T12:00:00'), notes: 'study notes' },
]

/* ── Helpers ── */

function setup() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  render(
    <MemoryRouter>
      <Sessions />
    </MemoryRouter>
  )
  return user
}

/** Flush the 300ms debounce timer and let React process the update */
async function flushDebounce() {
  await act(async () => { vi.advanceTimersByTime(300) })
}

/** Open the filter dropdown by clicking the filter icon button */
async function openFilterDropdown(user) {
  const filterBtn = screen.getByRole('button', { name: /filter sessions/i })
  await user.click(filterBtn)
}

/** Open the sort dropdown by clicking the sort icon button */
async function openSortDropdown(user) {
  const sortBtn = screen.getByRole('button', { name: /sort sessions/i })
  await user.click(sortBtn)
}

/** Select an option in a CustomSelect by clicking its trigger then the option */
async function selectCustomOption(user, labelText, optionLabel) {
  await user.click(screen.getByLabelText(labelText))
  const listbox = screen.getByRole('listbox')
  await user.click(within(listbox).getByText(optionLabel))
}

/* ── Tests ── */

describe('Sessions – Toolbar (search, sort, filter)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockSessions = [...SESSIONS]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── Render ───

  describe('renders toolbar controls', () => {
    it('shows the search input', () => {
      setup()
      expect(screen.getByLabelText(/search sessions by subject/i)).toBeInTheDocument()
    })

    it('shows the sort icon button', () => {
      setup()
      expect(screen.getByRole('button', { name: /sort sessions/i })).toBeInTheDocument()
    })

    it('shows the filter icon button', () => {
      setup()
      expect(screen.getByRole('button', { name: /filter sessions/i })).toBeInTheDocument()
    })

    it('does NOT show toolbar when there are zero sessions', () => {
      mockSessions = []
      setup()
      expect(screen.queryByLabelText(/search sessions by subject/i)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /sort sessions/i })).not.toBeInTheDocument()
    })
  })

  // ─── Sort dropdown ───

  describe('sort dropdown', () => {
    it('shows sort options when sort button is clicked', async () => {
      const user = setup()
      await openSortDropdown(user)

      expect(screen.getByRole('option', { name: /newest first/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /oldest first/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /subject/i })).toBeInTheDocument()
    })

    it('sorts by newest first by default (newest date first)', () => {
      setup()
      const items = screen.getAllByRole('listitem')
      // Default sort is newest: 3/25, 3/24, 3/22, 3/20, 3/18
      expect(within(items[0]).getByText('Physics')).toBeInTheDocument()
      expect(within(items[4]).getByText('History')).toBeInTheDocument()
    })

    it('sorts oldest first when selected', async () => {
      const user = setup()
      await openSortDropdown(user)
      await user.click(screen.getByRole('option', { name: /oldest first/i }))

      const items = screen.getAllByRole('listitem')
      // Oldest first: 3/18, 3/20, 3/22, 3/24, 3/25
      expect(within(items[0]).getByText('History')).toBeInTheDocument()
      expect(within(items[4]).getByText('Physics')).toBeInTheDocument()
    })

    it('sorts by subject A-Z when selected', async () => {
      const user = setup()
      await openSortDropdown(user)
      await user.click(screen.getByRole('option', { name: /subject/i }))

      const items = screen.getAllByRole('listitem')
      // Alphabetical: History, Mathematics, Mathematics, Physics, Physics
      expect(within(items[0]).getByText('History')).toBeInTheDocument()
    })

    it('highlights sort button when not default sort', async () => {
      const user = setup()
      const sortBtn = screen.getByRole('button', { name: /sort sessions/i })

      // Default — not active
      expect(sortBtn).not.toHaveClass('toolbar-icon-btn-active')

      await openSortDropdown(user)
      await user.click(screen.getByRole('option', { name: /oldest first/i }))

      expect(sortBtn).toHaveClass('toolbar-icon-btn-active')
    })
  })

  // ─── Filter dropdown ───

  describe('filter dropdown', () => {
    it('shows filter controls when filter button is clicked', async () => {
      const user = setup()
      await openFilterDropdown(user)

      expect(screen.getByLabelText('Subject')).toBeInTheDocument()
      expect(screen.getByLabelText('Status')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /select date range/i })).toBeInTheDocument()
    })

    it('shows subject dropdown with all unique subjects', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await user.click(screen.getByLabelText('Subject'))
      const listbox = screen.getByRole('listbox')
      const options = within(listbox).getAllByRole('option')
      expect(options).toHaveLength(4)
      expect(options.map(o => o.textContent)).toEqual([
        'All Subjects', 'History', 'Mathematics', 'Physics'
      ])
    })

    it('shows status dropdown with all status options', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await user.click(screen.getByLabelText('Status'))
      const listbox = screen.getByRole('listbox')
      const options = within(listbox).getAllByRole('option')
      expect(options).toHaveLength(4)
      expect(options[0].textContent).toBe('All Statuses')
    })
  })

  // ─── Text search ───

  describe('text search (debounced)', () => {
    it('filters sessions by subject after 300ms debounce', async () => {
      const user = setup()
      const input = screen.getByLabelText(/search sessions by subject/i)

      await user.type(input, 'math')

      // Before debounce fires — all 5 cards still visible
      expect(screen.getAllByRole('listitem')).toHaveLength(5)

      // Advance past debounce
      await flushDebounce()

      // Now only Mathematics sessions (2)
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    it('is case-insensitive', async () => {
      const user = setup()
      const input = screen.getByLabelText(/search sessions by subject/i)

      await user.type(input, 'PHYS')
      await flushDebounce()

      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })
  })

  // ─── Subject filter ───

  describe('subject filter', () => {
    it('filters to only matching subject', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'History')

      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })

  // ─── Status filter ───

  describe('status filter', () => {
    it('filters to only matching status', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Status', 'Complete')

      // 3 complete sessions
      expect(screen.getAllByRole('listitem')).toHaveLength(3)
    })

    it('filters in-progress sessions', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Status', 'In Progress')

      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })

  // ─── Combined filters (AND logic) ───

  describe('AND logic', () => {
    it('combines subject + status filter', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'Mathematics')
      await selectCustomOption(user, 'Status', 'Complete')

      // Only Mathematics + complete → session #1
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })

    it('combines text search + status filter', async () => {
      const user = setup()

      // Type in search
      await user.type(screen.getByLabelText(/search sessions by subject/i), 'Physics')
      await flushDebounce()

      // Open filter and set status
      await openFilterDropdown(user)
      await selectCustomOption(user, 'Status', 'Complete')

      // Physics + complete → session #3
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })

  // ─── Result count ───

  describe('result count', () => {
    it('shows "Showing X of Y sessions" when a filter is active', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'Physics')

      expect(screen.getByText(/showing 2 of 5 sessions/i)).toBeInTheDocument()
    })

    it('shows result count when search is active', async () => {
      const user = setup()

      await user.type(screen.getByLabelText(/search sessions by subject/i), 'math')
      await flushDebounce()

      expect(screen.getByText(/showing 2 of 5 sessions/i)).toBeInTheDocument()
    })

    it('does NOT show result count when no filter or search is active', () => {
      setup()
      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument()
    })
  })

  // ─── No-results empty state ───

  describe('no-results empty state', () => {
    it('shows "No sessions match your filters" when filters yield zero results', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'History')
      await selectCustomOption(user, 'Status', 'Incomplete')

      // History has only complete sessions → 0 results
      expect(screen.getByText(/no sessions match your filters/i)).toBeInTheDocument()
      expect(screen.queryByText(/no sessions yet/i)).not.toBeInTheDocument()
    })

    it('shows "Clear all filters" button in filtered empty state', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'History')
      await selectCustomOption(user, 'Status', 'Incomplete')

      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument()
    })

    it('"Clear all filters" in empty state resets everything', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'History')
      await selectCustomOption(user, 'Status', 'Incomplete')

      expect(screen.getByText(/no sessions match your filters/i)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /clear all filters/i }))
      await flushDebounce()

      // All 5 sessions restored
      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })
  })

  // ─── Clear filters inside dropdown ───

  describe('clear filters in dropdown', () => {
    it('clear button appears when filter is active', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Status', 'Complete')

      expect(screen.getByRole('button', { name: /^clear$/i })).toBeInTheDocument()
    })

    it('clear button resets filter dropdowns', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'Physics')
      await selectCustomOption(user, 'Status', 'Complete')

      // Only Physics + complete → session #3
      expect(screen.getAllByRole('listitem')).toHaveLength(1)

      await user.click(screen.getByRole('button', { name: /^clear$/i }))

      // All 5 sessions restored
      expect(screen.getAllByRole('listitem')).toHaveLength(5)
    })
  })

  // ─── Filter count badge ───

  describe('filter count badge', () => {
    it('shows badge with count when filters are active', async () => {
      const user = setup()
      await openFilterDropdown(user)

      await selectCustomOption(user, 'Subject', 'Physics')
      await selectCustomOption(user, 'Status', 'Complete')

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('highlights filter button when filters are active', async () => {
      const user = setup()
      const filterBtn = screen.getByRole('button', { name: /filter sessions/i })

      expect(filterBtn).not.toHaveClass('toolbar-icon-btn-active')

      await openFilterDropdown(user)
      await selectCustomOption(user, 'Subject', 'Physics')

      expect(filterBtn).toHaveClass('toolbar-icon-btn-active')
    })
  })

  // ─── Firestore Timestamp handling ───

  describe('Firestore Timestamp dates', () => {
    it('handles sessions with Firestore Timestamp .toDate()', async () => {
      mockSessions = [
        {
          id: 'ts1',
          subject: 'Chemistry',
          color: '#06B6D4',
          status: 'complete',
          duration: 30,
          date: { toDate: () => new Date('2026-03-23T12:00:00') },
          notes: '',
        },
      ]
      setup()

      // Should render without error
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })
})
