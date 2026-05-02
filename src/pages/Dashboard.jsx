import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  addDays, subDays,
  addWeeks,
  addMonths,
  format, isWithinInterval,
  differenceInCalendarDays,
} from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useSessions, useAssignments } from '../hooks/useFirestore'
import { formatDuration } from '../utils/format'
import StudyVibe from '../components/StudyVibe'
import DashboardDeadlineCard from '../components/DashboardDeadlineCard'
import DashboardSessionCard from '../components/DashboardSessionCard'
import './Dashboard.css'

// ── Helpers ──────────────────────────────────────────────

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function computeStreak(sessions) {
  if (!sessions.length) return 0
  const dates = new Set(
    sessions
      .map(s => {
        const d = toDate(s.date)
        return d ? format(d, 'yyyy-MM-dd') : null
      })
      .filter(Boolean)
  )
  let count = 0
  let day = new Date()
  // If today has no session, start streak check from yesterday
  if (!dates.has(format(day, 'yyyy-MM-dd'))) {
    day = subDays(day, 1)
  }
  while (dates.has(format(day, 'yyyy-MM-dd'))) {
    count++
    day = subDays(day, 1)
  }
  return count
}

function progressColor(pct) {
  if (pct >= 66) return '#059669'
  if (pct >= 33) return '#d97706'
  return '#dc2626'
}

// ── Confetti burst directions (tx = horizontal px, ty = vertical px from center) ──
const CONFETTI_DATA = [
  { tx: -320, ty: 280 }, { tx: 290, ty: 350 }, { tx: -180, ty: 200 },
  { tx: 360, ty: 420 }, { tx: -90, ty: 310 }, { tx: 230, ty:  90 },
  { tx: -300, ty: 390 }, { tx: 160, ty: 160 }, { tx: -240, ty: 330 },
  { tx: 370, ty: 460 }, { tx: -120, ty: -40 }, { tx: 260, ty: 370 },
  { tx: -380, ty: 220 }, { tx: 190, ty: 490 }, { tx: -150, ty: 130 },
  { tx: 330, ty: 300 }, { tx:  -70, ty: 370 }, { tx: 280, ty:  60 },
  { tx: -260, ty: 440 }, { tx: 110, ty: 230 },
]

const CONFETTI_COLORS = ['#6366F1','#D946EF','#06B6D4','#059669','#A855F7','#f97316']

// ── Component ──────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { sessions, loading: sessionsLoading } = useSessions(currentUser?.uid)
  const { assignments, loading: assignmentsLoading } = useAssignments(currentUser?.uid)

  const [viewMode, setViewMode] = useState('week') // 'today' | 'week' | 'month'
  const [offset, setOffset] = useState(0)          // 0 = current period
  const [confettiActive, setConfettiActive] = useState(false)

  const loading = sessionsLoading || assignmentsLoading

  // Always-current week: used for stat cards + progress bar
  const currentWeekRange = useMemo(() => {
    const now = new Date()
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    }
  }, [])

  // Date range for the toggle view (changes with mode + offset)
  const range = useMemo(() => {
    const now = new Date()
    if (viewMode === 'today') {
      const d = addDays(now, offset)
      return { start: startOfDay(d), end: endOfDay(d) }
    }
    if (viewMode === 'week') {
      const base = addWeeks(now, offset)
      return {
        start: startOfWeek(base, { weekStartsOn: 1 }),
        end: endOfWeek(base, { weekStartsOn: 1 }),
      }
    }
    const base = addMonths(now, offset)
    return { start: startOfMonth(base), end: endOfMonth(base) }
  }, [viewMode, offset])

  const rangeLabel = useMemo(() => {
    if (viewMode === 'today') return format(range.start, 'EEEE, MMM d, yyyy')
    if (viewMode === 'week') {
      return `${format(range.start, 'MMM d')} \u2013 ${format(range.end, 'MMM d, yyyy')}`
    }
    return format(range.start, 'MMMM yyyy')
  }, [viewMode, range])

  // ── Stat card values (anchored to current week / now) ──

  const minutesThisWeek = useMemo(
    () =>
      sessions
        .filter(s => {
          const d = toDate(s.date)
          return d && isWithinInterval(d, currentWeekRange)
        })
        .reduce((sum, s) => sum + (s.duration || 0), 0),
    [sessions, currentWeekRange]
  )

  const sessionsThisWeek = useMemo(
    () =>
      sessions.filter(s => {
        const d = toDate(s.date)
        return d && isWithinInterval(d, currentWeekRange)
      }).length,
    [sessions, currentWeekRange]
  )

  const upcomingCount = useMemo(
    () =>
      assignments.filter(a => {
        if (a.completed) return false
        const d = toDate(a.dueDate)
        if (!d) return false
        const daysUntil = differenceInCalendarDays(d, new Date())
        return daysUntil >= 0 && daysUntil <= 7
      }).length,
    [assignments]
  )

  const overdueCount = useMemo(
    () =>
      assignments.filter(a => {
        if (a.completed) return false
        const d = toDate(a.dueDate)
        return d != null && differenceInCalendarDays(d, new Date()) < 0
      }).length,
    [assignments]
  )

  const streak = useMemo(() => computeStreak(sessions), [sessions])

  // ── Weekly progress bar (current week, not affected by navigation) ──

  const weeklyProgress = useMemo(() => {
    const dueThisWeek = assignments.filter(a => {
      const d = toDate(a.dueDate)
      return d && isWithinInterval(d, currentWeekRange)
    })
    if (!dueThisWeek.length) return null
    const done = dueThisWeek.filter(a => a.completed).length
    const pct = Math.round((done / dueThisWeek.length) * 100)
    return { done, total: dueThisWeek.length, pct }
  }, [assignments, currentWeekRange])

  // ── Filtered lists (change with toggle + navigation) ──

  const filteredSessions = useMemo(
    () =>
      sessions
        .filter(s => {
          const d = toDate(s.date)
          return d && isWithinInterval(d, range)
        })
        .sort((a, b) => {
          const da = toDate(a.date)
          const db = toDate(b.date)
          return (db?.getTime() ?? 0) - (da?.getTime() ?? 0)
        })
        .slice(0, 5),
    [sessions, range]
  )

  const filteredDeadlines = useMemo(
    () =>
      assignments
        .filter(a => {
          if (a.completed) return false
          const d = toDate(a.dueDate)
          return d && isWithinInterval(d, range)
        })
        .sort((a, b) => {
          const da = toDate(a.dueDate)
          const db = toDate(b.dueDate)
          return (da?.getTime() ?? 0) - (db?.getTime() ?? 0)
        })
        .slice(0, 5),
    [assignments, range]
  )

  function handleTabClick(mode) {
    if (mode !== viewMode) setViewMode(mode)
    setOffset(0)
  }

  const periodName = useMemo(() => {
    if (offset !== 0) return 'during this period'
    if (viewMode === 'today') return 'today'
    if (viewMode === 'week') return 'this week'
    return 'this month'
  }, [offset, viewMode])

  useEffect(() => {
    if (weeklyProgress?.pct !== 100) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setConfettiActive(true)
    const id = setTimeout(() => setConfettiActive(false), 3500)
    return () => clearTimeout(id)
  }, [weeklyProgress?.pct])

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-inner">
          <div role="status" aria-label="Loading dashboard" className="dashboard-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">

      {/* ── Full-width top: heading + stat cards + progress bar ── */}
      <div className="dashboard-top">
        <h1 className="dashboard-heading">Dashboard</h1>

        {/* ── Stat Cards ── */}
        <div className="stat-cards-grid">
          <button
            className="stat-card stat-card-hours"
            onClick={() => navigate('/sessions')}
            aria-label={`${formatDuration(minutesThisWeek)} studied this week. Go to Sessions.`}
          >
            <span className="stat-card-icon material-symbols-outlined" aria-hidden="true">schedule</span>
            <span className="stat-card-value">
              {Math.floor(minutesThisWeek / 60) > 0 ? `${Math.floor(minutesThisWeek / 60)}h` : `${minutesThisWeek}m`}
            </span>
            {Math.floor(minutesThisWeek / 60) > 0 && minutesThisWeek % 60 > 0 && (
              <span className="stat-card-subvalue">{minutesThisWeek % 60}m</span>
            )}
            <span className="stat-card-label">Hours This Week</span>
          </button>

          <button
            className="stat-card"
            onClick={() => navigate('/sessions')}
            aria-label={`${sessionsThisWeek} sessions this week. Go to Sessions.`}
          >
            <span className="stat-card-icon material-symbols-outlined" aria-hidden="true">menu_book</span>
            <span className="stat-card-value">{sessionsThisWeek}</span>
            <span className="stat-card-label">Sessions This Week</span>
          </button>

          <button
            className="stat-card"
            onClick={() => navigate('/assignments')}
            aria-label={`${upcomingCount} upcoming deadlines. Go to Assignments.`}
          >
            <span className="stat-card-icon material-symbols-outlined" aria-hidden="true">assignment</span>
            <span className="stat-card-value">{upcomingCount}</span>
            <span className="stat-card-label">Upcoming Deadlines</span>
          </button>

          <button
            className={`stat-card${overdueCount > 0 ? ' stat-card-overdue' : ''}`}
            onClick={() => navigate('/assignments')}
            aria-label={`${overdueCount} overdue assignments. Go to Assignments.`}
          >
            <span className="stat-card-icon material-symbols-outlined" aria-hidden="true">
              {overdueCount > 0 ? 'warning' : 'check_circle'}
            </span>
            <span className="stat-card-value">{overdueCount}</span>
            <span className="stat-card-label">Overdue</span>
          </button>

          <button
            className={`stat-card${streak > 0 ? ' stat-card-streak' : ''}`}
            onClick={() => navigate('/sessions')}
            aria-label={`${streak}-day study streak. Go to Sessions.`}
          >
            <span className="stat-card-icon material-symbols-outlined" aria-hidden="true">local_fire_department</span>
            <span className="stat-card-value">{streak}</span>
            <span className="stat-card-label">Day Streak</span>
          </button>
        </div>

        {/* ── Weekly Progress Bar ── */}
        {weeklyProgress ? (
          <div className={`progress-section${weeklyProgress.pct === 100 ? ' progress-100' : ''}`}>
            <div className="progress-header">
              <span className="progress-label">This week&apos;s assignments</span>
              <span className="progress-fraction">
                {weeklyProgress.done} / {weeklyProgress.total} ({weeklyProgress.pct}%)
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuenow={weeklyProgress.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${weeklyProgress.pct}% of this week's assignments completed`}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${weeklyProgress.pct}%`,
                  backgroundColor: progressColor(weeklyProgress.pct),
                }}
              />
            </div>
            {weeklyProgress.pct === 100 && (
              <p className="progress-complete-msg" aria-live="polite">
                All this week&apos;s assignments complete!
              </p>
            )}
          </div>
        ) : (
          <div className="progress-section progress-none">
            <span className="material-symbols-outlined progress-none-icon" aria-hidden="true">event_available</span>
            <span className="progress-none-label">No assignments due this week</span>
          </div>
        )}

      </div>{/* end dashboard-top */}

      {/* ── Two-column body: toggle+lists left, sidebar right ── */}
      <main className="dashboard-main">
        {/* ── Toggle View ── */}
        <div className="toggle-section">
          <div className="toggle-controls">
            <button
              className="period-nav-btn"
              onClick={() => setOffset(o => o - 1)}
              aria-label="Previous period"
            >
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>

            <div className="period-tabs" role="tablist" aria-label="View period">
              {(['today', 'week', 'month']).map(mode => (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={viewMode === mode}
                  className={`period-tab${viewMode === mode ? ' active' : ''}`}
                  onClick={() => handleTabClick(mode)}
                >
                  {mode === 'today' ? 'Today' : mode === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>

            <button
              className="period-nav-btn"
              onClick={() => setOffset(o => o + 1)}
              aria-label="Next period"
            >
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>

          <p className="period-range-label" aria-live="polite">{rangeLabel}</p>

          {/* Upcoming Deadlines */}
          <section aria-labelledby="dash-deadlines-heading">
            <h2 id="dash-deadlines-heading" className="list-section-heading">Upcoming Deadlines</h2>
            {filteredDeadlines.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined empty-state-icon" aria-hidden="true">assignment</span>
                <p>No deadlines {periodName}.</p>
                {offset === 0 && (
                  <button className="btn-empty-action" onClick={() => navigate('/assignments')}>
                    <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                    Add Assignment
                  </button>
                )}
              </div>
            ) : (
              <ul className="dash-list">
                {filteredDeadlines.map(a => (
                  <DashboardDeadlineCard key={a.id} assignment={a} />
                ))}
              </ul>
            )}
          </section>

          {/* Recent Sessions */}
          <section aria-labelledby="dash-sessions-heading">
            <h2 id="dash-sessions-heading" className="list-section-heading">Recent Sessions</h2>
            {filteredSessions.length === 0 ? (
              <div className="empty-state">
                <span className="material-symbols-outlined empty-state-icon" aria-hidden="true">menu_book</span>
                <p>No sessions logged {periodName}.</p>
                {offset === 0 && (
                  <button className="btn-empty-action" onClick={() => navigate('/sessions')}>
                    <span className="material-symbols-outlined" aria-hidden="true">add_circle</span>
                    Log a Session
                  </button>
                )}
              </div>
            ) : (
              <ul className="dash-list">
                {filteredSessions.map(s => (
                  <DashboardSessionCard key={s.id} session={s} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>

      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar" aria-label="Study Vibe">
        <StudyVibe />
      </aside>

      </div>
      {confettiActive && (
        <div className="confetti-overlay" aria-hidden="true">
          {CONFETTI_DATA.map((d, i) => (
            <div
              key={`confetti-${i}`}
              className="confetti-particle"
              style={{
                '--p-tx': `${d.tx}px`,
                '--p-ty': `${d.ty}px`,
                '--p-rot': `${(i * 137) % 720}deg`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i * 0.06) % 0.6}s`,
                width: i % 3 === 0 ? '12px' : '8px',
                height: i % 3 === 0 ? '12px' : '8px',
                borderRadius: i % 2 === 0 ? '2px' : '50%',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
