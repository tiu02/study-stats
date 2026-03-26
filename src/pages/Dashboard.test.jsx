import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import Dashboard from './Dashboard'
import { useAuth } from '../context/AuthContext'
import { useSessions, useAssignments } from '../hooks/useFirestore'

// ── Module mocks (hoisted by Vitest) ──────────────────────

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useNavigate: vi.fn() }
})

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

vi.mock('../hooks/useFirestore', () => ({
  useSessions: vi.fn(),
  useAssignments: vi.fn(),
}))

// ── Helpers ────────────────────────────────────────────────

/**
 * Simulates a Firestore Timestamp.
 * IMPORTANT: always pass "YYYY-MM-DDT12:00:00" (local noon, no timezone suffix).
 * Date-only ISO strings (e.g. "2026-03-23") are parsed as UTC midnight, which
 * shifts to the previous calendar day in UTC-negative timezones and would put
 * sessions outside the Mon-Sun week boundary computed from local time.
 */
const ts = (iso) => ({ toDate: () => new Date(iso) })

// ── Test data ──────────────────────────────────────────────
//
// Pinned "today": local noon Wednesday 2026-03-25
// Current week (weekStartsOn: 1):  Mon 2026-03-23 → Sun 2026-03-29 (local)
//
// Expected stat values with SESSIONS + ASSIGNMENTS below:
//   Hours this week  : 90 + 60 + 30 = 180 min → "3h"
//   Sessions / week  : 3  (s1 Mon, s2 Tue, s3 Wed; s4 Mar-10 excluded)
//   Upcoming (0–7 d) : 2  (a1 +1 day, a3 +3 days; a2 overdue, a4 completed excluded)
//   Overdue          : 1  (a2 −3 days, prev-week Sunday Mar-22)
//   Streak           : 3  (Mon ✓ Tue ✓ Wed ✓ → gap before Mon)
//   Progress bar     : a1(incomplete) + a3(incomplete) + a4(complete) = 1/3 = 33%
//                      a2 due local Mar-22 falls in the previous Mon–Sun week

const SESSIONS = [
  { id: 's1', subject: 'Math',    duration: 90, date: ts('2026-03-23T12:00:00'), color: '#6366F1', status: 'complete'    }, // Mon  — 90 min
  { id: 's2', subject: 'History', duration: 60, date: ts('2026-03-24T12:00:00'), color: '#2563EB', status: 'complete'    }, // Tue  — 60 min
  { id: 's3', subject: 'Math',    duration: 30, date: ts('2026-03-25T12:00:00'), color: '#6366F1', status: 'in-progress' }, // Wed (today) — 30 min
  { id: 's4', subject: 'Science', duration: 45, date: ts('2026-03-10T12:00:00'), color: '#A855F7', status: 'complete'    }, // old — excluded
]

const ASSIGNMENTS = [
  { id: 'a1', title: 'Calculus HW',    subject: 'Math',    color: '#6366F1', dueDate: ts('2026-03-26T12:00:00'), completed: false }, // Thu +1d — upcoming + in-week
  { id: 'a2', title: 'History Essay',  subject: 'History', color: '#2563EB', dueDate: ts('2026-03-22T12:00:00'), completed: false }, // prev-week Sun — overdue only
  { id: 'a3', title: 'Lab Report',     subject: 'Science', color: '#A855F7', dueDate: ts('2026-03-28T12:00:00'), completed: false }, // Sat +3d — upcoming + in-week
  { id: 'a4', title: 'Completed Task', subject: 'Math',    color: '#6366F1', dueDate: ts('2026-03-27T12:00:00'), completed: true  }, // Fri — completed, in-week
]

// ── Render helper ──────────────────────────────────────────

const mockNavigate = vi.fn()

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  )
}

// ── Setup / teardown ───────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers()
  // Local noon — no timezone suffix so JS parses as local time, matching how
  // date-fns computes startOfWeek/endOfWeek from the local calendar.
  vi.setSystemTime(new Date('2026-03-25T12:00:00'))

  useAuth.mockReturnValue({ currentUser: { uid: 'test-uid' } })
  useSessions.mockReturnValue({ sessions: SESSIONS, loading: false })
  useAssignments.mockReturnValue({ assignments: ASSIGNMENTS, loading: false })
  useNavigate.mockReturnValue(mockNavigate)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

// ══════════════════════════════════════════════════════════════════════════════

describe('Dashboard', () => {

  // ── Loading state ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows spinner and hides content while sessions are fetching', () => {
      useSessions.mockReturnValue({ sessions: [], loading: true })
      renderDashboard()
      expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /dashboard/i })).not.toBeInTheDocument()
    })

    it('shows spinner and hides content while assignments are fetching', () => {
      useAssignments.mockReturnValue({ assignments: [], loading: true })
      renderDashboard()
      expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: /dashboard/i })).not.toBeInTheDocument()
    })

    it('renders page heading and no spinner once both hooks resolve', () => {
      renderDashboard()
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument()
    })
  })

  // ── Stat cards ───────────────────────────────────────────────────────────

  describe('stat cards', () => {
    // "Upcoming Deadlines" also appears as an <h2> section heading, so scope
    // all label checks to the stat-cards-grid container.
    it('renders all five card labels inside the grid', () => {
      const { container } = renderDashboard()
      const grid = container.querySelector('.stat-cards-grid')
      expect(grid).toHaveTextContent('Hours This Week')
      expect(grid).toHaveTextContent('Sessions This Week')
      expect(grid).toHaveTextContent('Upcoming Deadlines')
      expect(grid).toHaveTextContent('Overdue')
      expect(grid).toHaveTextContent('Day Streak')
    })

    it('hours this week: 90+60+30 min = "3h" (old s4 session on Mar-10 excluded)', () => {
      renderDashboard()
      expect(screen.getByText('Hours This Week').closest('button')).toHaveTextContent('3h')
    })

    it('sessions this week: 3 (Mon/Tue/Wed; old Mar-10 session excluded)', () => {
      renderDashboard()
      expect(screen.getByText('Sessions This Week').closest('button')).toHaveTextContent('3')
    })

    it('upcoming deadlines: 2 (Thu +1d, Sat +3d; overdue a2 and completed a4 excluded)', () => {
      renderDashboard()
      // Use getAllByText because "Upcoming Deadlines" also appears as an h2 heading
      const matches = screen.getAllByText('Upcoming Deadlines')
      const statCard = matches.find((el) => el.closest('button'))
      expect(statCard.closest('button')).toHaveTextContent('2')
    })

    it('overdue: 1 (a2 Mar-22 prev-week Sunday; completed a4 excluded)', () => {
      renderDashboard()
      expect(screen.getByText('Overdue').closest('button')).toHaveTextContent('1')
    })

    it('day streak: 3 consecutive days (Mon, Tue, Wed)', () => {
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('3')
    })
  })

  // ── Streak calculation ────────────────────────────────────────────────────

  describe('streak calculation', () => {
    it('returns 0 when sessions array is empty', () => {
      useSessions.mockReturnValue({ sessions: [], loading: false })
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('0')
    })

    it('returns 1 when the only session is today', () => {
      useSessions.mockReturnValue({
        sessions: [{ id: 's1', subject: 'Math', duration: 30, date: ts('2026-03-25T12:00:00'), color: '#6366F1', status: 'complete' }],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('1')
    })

    it('returns 1 when the only session is yesterday (grace period: streak not broken yet)', () => {
      useSessions.mockReturnValue({
        sessions: [{ id: 's1', subject: 'Math', duration: 30, date: ts('2026-03-24T12:00:00'), color: '#6366F1', status: 'complete' }],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('1')
    })

    it('breaks at a gap: session today (Wed) + Mon but NOT Tue (yesterday) → streak is 1', () => {
      // Wed today ✓, Tue gap ✗ → streak stops at 1 even though Mon also has a session
      useSessions.mockReturnValue({
        sessions: [
          { id: 's1', subject: 'Math', duration: 30, date: ts('2026-03-23T12:00:00'), color: '#6366F1', status: 'complete' }, // Mon
          { id: 's2', subject: 'Math', duration: 30, date: ts('2026-03-25T12:00:00'), color: '#6366F1', status: 'complete' }, // Wed
        ],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('1')
    })

    it('returns 0 when all sessions are older than yesterday', () => {
      useSessions.mockReturnValue({
        sessions: [{ id: 's1', subject: 'Math', duration: 30, date: ts('2026-03-10T12:00:00'), color: '#6366F1', status: 'complete' }],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('0')
    })
  })

  // ── Progress bar ──────────────────────────────────────────────────────────

  describe('progress bar', () => {
    it('shows ratio and percentage: 1 of 3 in-week assignments complete (33%)', () => {
      renderDashboard()
      // a1 incomplete + a3 incomplete + a4 complete = 3 total, 1 done
      // a2 due local Mar-22 is the previous Mon–Sun week, so excluded
      expect(screen.getByText(/1 \/ 3 \(33%\)/)).toBeInTheDocument()
    })

    it('shows empty state when no assignments are due this week', () => {
      useAssignments.mockReturnValue({ assignments: [], loading: false })
      renderDashboard()
      expect(screen.getByText('No assignments due this week')).toBeInTheDocument()
    })

    it('shows 0 / N (0%) when all in-week assignments are incomplete', () => {
      useAssignments.mockReturnValue({
        assignments: [
          { id: 'a1', title: 'HW1', subject: 'Math', color: '#6366F1', dueDate: ts('2026-03-26T12:00:00'), completed: false },
          { id: 'a2', title: 'HW2', subject: 'Math', color: '#6366F1', dueDate: ts('2026-03-27T12:00:00'), completed: false },
        ],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText(/0 \/ 2 \(0%\)/)).toBeInTheDocument()
    })

    it('shows N / N (100%) and the complete message when all in-week assignments are done', () => {
      useAssignments.mockReturnValue({
        assignments: [
          { id: 'a1', title: 'HW1', subject: 'Math', color: '#6366F1', dueDate: ts('2026-03-26T12:00:00'), completed: true },
        ],
        loading: false,
      })
      renderDashboard()
      expect(screen.getByText(/1 \/ 1 \(100%\)/)).toBeInTheDocument()
      expect(screen.getByText(/all this week.*assignments complete/i)).toBeInTheDocument()
    })

    it('does NOT show the complete message when progress is below 100%', () => {
      renderDashboard() // default data: 1/3 = 33%
      expect(screen.queryByText(/all this week.*assignments complete/i)).not.toBeInTheDocument()
    })
  })

  // ── Empty states (new user, no data) ─────────────────────────────────────

  describe('empty states — new user with no data', () => {
    beforeEach(() => {
      useSessions.mockReturnValue({ sessions: [], loading: false })
      useAssignments.mockReturnValue({ assignments: [], loading: false })
    })

    it('stat cards all show zero / empty values', () => {
      const { container } = renderDashboard()
      expect(screen.getByText('Hours This Week').closest('button')).toHaveTextContent('0m')
      expect(screen.getByText('Sessions This Week').closest('button')).toHaveTextContent('0')
      // Scope to grid to avoid clash with "Upcoming Deadlines" h2
      const grid = container.querySelector('.stat-cards-grid')
      expect(grid.querySelector('.stat-card:nth-child(3)')).toHaveTextContent('0')
      expect(screen.getByText('Overdue').closest('button')).toHaveTextContent('0')
      expect(screen.getByText('Day Streak').closest('button')).toHaveTextContent('0')
    })

    it('progress bar shows "No assignments due this week"', () => {
      renderDashboard()
      expect(screen.getByText('No assignments due this week')).toBeInTheDocument()
    })

    it('sessions section shows empty text and "Log a Session" shortcut button', () => {
      renderDashboard()
      expect(screen.getByText(/no sessions logged this week/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /log a session/i })).toBeInTheDocument()
    })

    it('deadlines section shows empty text and "Add Assignment" shortcut button', () => {
      renderDashboard()
      expect(screen.getByText(/no deadlines this week/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add assignment/i })).toBeInTheDocument()
    })
  })

  // ── Toggle view and date navigation ──────────────────────────────────────

  describe('toggle view and date navigation', () => {
    it('defaults to This Week showing the Mon–Sun range for the current week', () => {
      renderDashboard()
      expect(screen.getByText('Mar 23 \u2013 Mar 29, 2026')).toBeInTheDocument()
    })

    it('switching to Today shows the full formatted date for today', () => {
      renderDashboard()
      fireEvent.click(screen.getByRole('tab', { name: 'Today' }))
      expect(screen.getByText('Wednesday, Mar 25, 2026')).toBeInTheDocument()
    })

    it('switching to This Month shows the month and year', () => {
      renderDashboard()
      fireEvent.click(screen.getByRole('tab', { name: 'This Month' }))
      expect(screen.getByText('March 2026')).toBeInTheDocument()
    })

    it('left chevron navigates to the previous week', () => {
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
      expect(screen.getByText('Mar 16 \u2013 Mar 22, 2026')).toBeInTheDocument()
    })

    it('right chevron navigates to the next week', () => {
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /next period/i }))
      expect(screen.getByText('Mar 30 \u2013 Apr 5, 2026')).toBeInTheDocument()
    })

    it('clicking the already-active tab resets offset back to the current period', () => {
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
      expect(screen.getByText('Mar 16 \u2013 Mar 22, 2026')).toBeInTheDocument()
      // Click the still-active "This Week" tab — must snap back to current week
      fireEvent.click(screen.getByRole('tab', { name: 'This Week' }))
      expect(screen.getByText('Mar 23 \u2013 Mar 29, 2026')).toBeInTheDocument()
    })

    it('switching to a different tab always resets offset to current period for that mode', () => {
      renderDashboard()
      // Navigate two weeks back
      fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
      fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
      expect(screen.getByText('Mar 9 \u2013 Mar 15, 2026')).toBeInTheDocument()
      // Switch to Today — must show today, not two days ago
      fireEvent.click(screen.getByRole('tab', { name: 'Today' }))
      expect(screen.getByText('Wednesday, Mar 25, 2026')).toBeInTheDocument()
    })

    it('empty state shortcut buttons are hidden when viewing a past period', () => {
      useSessions.mockReturnValue({ sessions: [], loading: false })
      useAssignments.mockReturnValue({ assignments: [], loading: false })
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /previous period/i }))
      expect(screen.queryByRole('button', { name: /log a session/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /add assignment/i })).not.toBeInTheDocument()
    })
  })

  // ── List content ─────────────────────────────────────────────────────────

  describe('list content', () => {
    it('recent sessions shows durations for this-week sessions; excludes old session', () => {
      renderDashboard()
      expect(screen.getByText('1h 30m')).toBeInTheDocument() // s1: 90 min
      expect(screen.getByText('1h')).toBeInTheDocument()     // s2: 60 min
      expect(screen.getByText('30m')).toBeInTheDocument()    // s3: 30 min
      // s4 (45 min, Mar-10) must not appear in list
      expect(screen.queryByText('45m')).not.toBeInTheDocument()
    })

    it('upcoming deadlines shows in-week incomplete assignments; excludes overdue and completed', () => {
      renderDashboard()
      expect(screen.getByText('Calculus HW')).toBeInTheDocument()          // a1 Thu — in week
      expect(screen.getByText('Lab Report')).toBeInTheDocument()           // a3 Sat — in week
      expect(screen.queryByText('History Essay')).not.toBeInTheDocument()  // a2 overdue (prev-week Sun)
      expect(screen.queryByText('Completed Task')).not.toBeInTheDocument() // a4 completed
    })
  })

  // ── Stat card navigation ──────────────────────────────────────────────────

  describe('stat card navigation', () => {
    it('clicking Hours This Week navigates to /sessions', () => {
      renderDashboard()
      fireEvent.click(screen.getByText('Hours This Week').closest('button'))
      expect(mockNavigate).toHaveBeenCalledWith('/sessions')
    })

    it('clicking Sessions This Week navigates to /sessions', () => {
      renderDashboard()
      fireEvent.click(screen.getByText('Sessions This Week').closest('button'))
      expect(mockNavigate).toHaveBeenCalledWith('/sessions')
    })

    it('clicking Upcoming Deadlines navigates to /assignments', () => {
      const { container } = renderDashboard()
      const grid = container.querySelector('.stat-cards-grid')
      fireEvent.click(grid.querySelector('.stat-card:nth-child(3)'))
      expect(mockNavigate).toHaveBeenCalledWith('/assignments')
    })

    it('clicking Overdue navigates to /assignments', () => {
      renderDashboard()
      fireEvent.click(screen.getByText('Overdue').closest('button'))
      expect(mockNavigate).toHaveBeenCalledWith('/assignments')
    })

    it('clicking Day Streak navigates to /sessions', () => {
      renderDashboard()
      fireEvent.click(screen.getByText('Day Streak').closest('button'))
      expect(mockNavigate).toHaveBeenCalledWith('/sessions')
    })

    it('"Log a Session" empty state button navigates to /sessions', () => {
      useSessions.mockReturnValue({ sessions: [], loading: false })
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /log a session/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/sessions')
    })

    it('"Add Assignment" empty state button navigates to /assignments', () => {
      useAssignments.mockReturnValue({ assignments: [], loading: false })
      renderDashboard()
      fireEvent.click(screen.getByRole('button', { name: /add assignment/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/assignments')
    })
  })
})
