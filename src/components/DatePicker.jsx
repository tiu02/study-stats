import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// DateRangePicker.css must be imported first — DatePicker.css overrides
// .drp-dropdown positioning via cascade order (.dp-dropdown declared later wins)
import './DateRangePicker.css'
import './DatePicker.css'

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function sameDay(a, b) {
  return (
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', id, ...rest }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => value || new Date())
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

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
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [year, month])

  const prevMonth = useCallback(() => setViewDate(new Date(year, month - 1, 1)), [year, month])
  const nextMonth = useCallback(() => setViewDate(new Date(year, month + 1, 1)), [year, month])

  function handleDayClick(day) {
    onChange(day)
    setOpen(false)
  }

  function handleToggle() {
    setOpen((prev) => {
      if (!prev) setViewDate(value ? new Date(value) : new Date())
      return !prev
    })
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange(null)
    setOpen(false)
  }

  const today = new Date()
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const label = value
    ? value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="dp-wrap" ref={wrapRef}>
      {/* dp-control keeps trigger + clear as proper sibling buttons (no nested interactive elements) */}
      <div className="dp-control">
        <button
          {...rest}
          type="button"
          id={id}
          className={`dp-trigger${open ? ' dp-trigger-open' : ''}`}
          onClick={handleToggle}
          aria-expanded={open}
        >
          <span className="material-symbols-outlined dp-trigger-icon" aria-hidden="true">calendar_today</span>
          <span className={`dp-trigger-label${!value ? ' dp-placeholder' : ''}`}>
            {label || placeholder}
          </span>
        </button>
        {value && (
          <button
            type="button"
            className="dp-clear"
            onClick={handleClear}
            aria-label="Clear date"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {open && (
        <div className="drp-dropdown dp-dropdown" role="dialog" aria-label="Date calendar">
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
              const isSelected = sameDay(day, value)
              const isToday = sameDay(day, today)
              let cls = 'drp-day'
              if (isSelected) cls += ' drp-day-endpoint'
              if (isToday && !isSelected) cls += ' drp-day-today'
              return (
                <button
                  key={day.getDate()}
                  type="button"
                  className={cls}
                  onClick={() => handleDayClick(day)}
                  aria-label={day.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  aria-pressed={isSelected}
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
