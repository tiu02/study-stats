import { useState } from 'react'
import { format } from 'date-fns'
import './SessionForm.css'

const today = () => format(new Date(), 'yyyy-MM-dd')

const COLOR_PRESETS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EF4444', label: 'Red' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Gray' },
]

const STATUS_OPTIONS = [
  { value: 'complete', label: 'Complete' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'incomplete', label: 'Incomplete' },
]

function toDateString(value) {
  if (!value) return today()
  if (typeof value.toDate === 'function') return format(value.toDate(), 'yyyy-MM-dd')
  if (value instanceof Date) return format(value, 'yyyy-MM-dd')
  return String(value)
}

export default function SessionForm({ onSubmit, onCancel, initialData, subjects }) {
  const editing = Boolean(initialData)

  const initHours = initialData?.duration ? Math.floor(initialData.duration / 60) : ''
  const initMinutes = initialData?.duration ? initialData.duration % 60 : ''

  const [subject, setSubject] = useState(initialData?.subject || '')
  const [hours, setHours] = useState(initHours)
  const [minutes, setMinutes] = useState(initMinutes)
  const [date, setDate] = useState(toDateString(initialData?.date))
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [color, setColor] = useState(initialData?.color || '#6366F1')
  const [status, setStatus] = useState(initialData?.status || 'complete')
  const [errors, setErrors] = useState({})
  const [durationConfirmed, setDurationConfirmed] = useState(false)

  function getTotalMinutes() {
    const h = Number(hours) || 0
    const m = Number(minutes) || 0
    return h * 60 + m
  }

  function resetDurationConfirmed() {
    setDurationConfirmed(false)
  }

  function validate() {
    const next = {}
    if (!subject.trim()) next.subject = 'Subject is required.'
    else if (subject.trim().length > 150) next.subject = 'Subject must be 150 characters or less.'

    const total = getTotalMinutes()
    if (total <= 0) {
      next.duration = 'Duration must be greater than 0.'
    } else if (total > 20160) {
      next.duration = 'Duration cannot exceed 2 weeks (20,160 minutes).'
    }

    if (!date) next.date = 'Date is required.'
    if (notes.trim().length > 2000) next.notes = 'Notes must be 2,000 characters or less.'
    setErrors(next)
    if (Object.keys(next).length > 0) return false

    if (total > 1440 && !durationConfirmed) {
      setDurationConfirmed(true)
      return false
    }

    return true
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      subject: subject.trim(),
      duration: getTotalMinutes(),
      notes: notes.trim(),
      date: new Date(date + 'T00:00:00'),
      color,
      status,
    })
  }

  return (
    <form className="session-form" onSubmit={handleSubmit} aria-label={editing ? 'Edit session' : 'Add session'}>
      <h2>{editing ? 'Edit Session' : 'Add Session'}</h2>

      <label>
        Subject
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
          list="subject-suggestions"
          aria-required="true"
          autoComplete="off"
        />
        {subjects && subjects.length > 0 && (
          <datalist id="subject-suggestions">
            {subjects.map((s) => <option key={s} value={s} />)}
          </datalist>
        )}
        {errors.subject && <p className="field-error" role="alert">{errors.subject}</p>}
      </label>

      <fieldset className="color-picker">
        <legend>Color</legend>
        <div className="color-swatches">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`color-swatch${color === c.value ? ' selected' : ''}`}
              style={{ backgroundColor: c.value }}
              onClick={() => setColor(c.value)}
              aria-label={c.label}
              title={c.label}
            />
          ))}
        </div>
      </fieldset>

      <div className="session-form-row">
        <label>
          Duration
          <div className="duration-inputs">
            <div className="duration-field">
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => { setHours(e.target.value); resetDurationConfirmed() }}
                aria-label="Hours"
              />
              <span className="duration-unit">h</span>
            </div>
            <div className="duration-field">
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => { setMinutes(e.target.value); resetDurationConfirmed() }}
                aria-label="Minutes"
              />
              <span className="duration-unit">m</span>
            </div>
          </div>
          {errors.duration && <p className="field-error" role="alert">{errors.duration}</p>}
          {durationConfirmed && !errors.duration && (
            <p className="duration-warning" role="alert">That&apos;s over 24 hours &mdash; are you sure?</p>
          )}
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-required="true"
          />
          {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
        </label>
      </div>

      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>

      <label>
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </label>

      <div className="session-form-actions">
        <button type="submit" className="btn-primary">
          {durationConfirmed && !errors.duration
            ? (editing ? 'Yes, Save Changes' : 'Yes, Add Session')
            : (editing ? 'Save Changes' : 'Add Session')}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
