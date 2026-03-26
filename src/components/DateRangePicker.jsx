import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './DateRangePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function inRange(day, start, end) {
  if (!start || !end) return false
  const t = day.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

function formatLabel(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  if (!start && !end) return 'Date range'
  if (start && !end) return start.toLocaleDateString('en-US', opts) + ' \u2013 ...'
  if (!start && end) return '... \u2013 ' + end.toLocaleDateString('en-US', opts)
  if (sameDay(start, end)) return start.toLocaleDateString('en-US', opts)
  return start.toLocaleDateString('en-US', opts) + ' \u2013 ' + end.toLocaleDateString('en-US', opts)
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => startDate || new Date())
  const [selecting, setSelecting] = useState(null) // null | 'start' | 'end'
  const wrapRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const days = useMemo(() => {
    const first = new Date(year, month, 1)
    const startDow = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    // leading blanks
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [year, month])

  const prevMonth = useCallback(() => setViewDate(new Date(year, month - 1, 1)), [year, month])
  const nextMonth = useCallback(() => setViewDate(new Date(year, month + 1, 1)), [year, month])

  function handleDayClick(day) {
    if (!selecting || selecting === 'start') {
      // First click — set start, clear end
      onChange(day, null)
      setSelecting('end')
    } else {
      // Second click — set end (ensure start <= end)
      if (day < startDate) {
        onChange(day, startDate)
      } else {
        onChange(startDate, day)
      }
      setSelecting(null)
      setOpen(false)
    }
  }

  function handleToggle() {
    if (open) {
      setOpen(false)
    } else {
      setSelecting('start')
      setOpen(true)
      if (startDate) setViewDate(new Date(startDate))
      else setViewDate(new Date())
    }
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange(null, null)
    setSelecting(null)
    setOpen(false)
  }

  const hasValue = startDate || endDate
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date()

  return (
    <div className="drp-wrap" ref={wrapRef}>
      {/* drp-control keeps trigger + clear as proper sibling buttons (no nested interactive elements) */}
      <div className="drp-control">
        <button
          type="button"
          className={`drp-trigger${hasValue ? ' drp-trigger-active' : ''}${open ? ' drp-trigger-open' : ''}`}
          onClick={handleToggle}
          aria-label="Select date range"
          aria-expanded={open}
        >
          <span className="material-symbols-outlined drp-trigger-icon" aria-hidden="true">calendar_today</span>
          <span className="drp-trigger-label">{formatLabel(startDate, endDate)}</span>
        </button>
        {hasValue && (
          <button
            type="button"
            className="drp-clear"
            onClick={handleClear}
            aria-label="Clear date range"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {open && (
        <div className="drp-dropdown" role="dialog" aria-label="Date range calendar">
          {selecting === 'end' && (
            <p className="drp-hint">Select end date</p>
          )}
          {selecting === 'start' && (
            <p className="drp-hint">Select start date</p>
          )}

          <div className="drp-nav">
            <button type="button" className="drp-nav-btn" onClick={prevMonth} aria-label="Previous month">
              <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
            </button>
            <span className="drp-month-label">{monthLabel}</span>
            <button type="button" className="drp-nav-btn" onClick={nextMonth} aria-label="Next month">
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          </div>

          <div className="drp-grid">
            {DAYS.map((d) => (
              <div key={d} className="drp-dow">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`blank-${i}`} className="drp-blank" />
              const isStart = sameDay(day, startDate)
              const isEnd = sameDay(day, endDate)
              const isIn = inRange(day, startDate, endDate)
              const isToday = sameDay(day, today)
              let cls = 'drp-day'
              if (isStart || isEnd) cls += ' drp-day-endpoint'
              if (isIn && !isStart && !isEnd) cls += ' drp-day-in-range'
              if (isToday) cls += ' drp-day-today'

              return (
                <button
                  key={day.getDate()}
                  type="button"
                  className={cls}
                  onClick={() => handleDayClick(day)}
                  aria-label={day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  aria-pressed={isStart || isEnd}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
