import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import './SessionForm.css'

const today = () => format(new Date(), 'yyyy-MM-dd')

/* Urgency-safe presets — no red/amber/green (reserved for urgency indicators) */
const COLOR_PRESETS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#2563EB', label: 'Cobalt' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#F97316', label: 'Orange' },
  { value: '#64748B', label: 'Slate' },
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

function formatMinutes(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/* Duration warning modal — matches delete modal pattern */
function DurationWarningModal({ open, onCancel, onConfirm, duration, formId }) {
  const contentRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const el = contentRef.current
    if (el) el.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onCancel(); return }
      if (e.key === 'Tab' && el) {
        const focusable = el.querySelectorAll('button')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="duration-warning-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div
        className="duration-warning-modal"
        ref={contentRef}
        role="alertdialog"
        aria-label="Duration warning"
        aria-describedby={`${formId}-dur-warn-desc`}
        aria-modal="true"
        tabIndex={-1}
      >
        <span className="material-symbols-outlined warning-icon" aria-hidden="true">warning</span>
        <h2>Duration Over 24 Hours</h2>
        <p id={`${formId}-dur-warn-desc`}>
          You entered {formatMinutes(duration)}. Are you sure this is correct?
        </p>
        <div className="duration-warning-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-confirm" onClick={onConfirm}>Yes, Continue</button>
        </div>
      </div>
    </div>
  )
}

export default function SessionForm({ onSubmit, onCancel, initialData, classMap, formId, formError }) {
  const editing = Boolean(initialData?.id)
  const id = formId || (editing ? 'edit' : 'add')

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
  const [showDurationWarning, setShowDurationWarning] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function getTotalMinutes() {
    const h = Number(hours) || 0
    const m = Number(minutes) || 0
    return h * 60 + m
  }

  function resetDurationConfirmed() {
    setDurationConfirmed(false)
    setShowDurationWarning(false)
  }

  function validate() {
    const next = {}
    if (!subject.trim()) next.subject = 'Subject is required.'
    else if (subject.trim().length > 40) next.subject = 'Subject must be 40 characters or less.'

    const m = Number(minutes) || 0
    if (m > 59) {
      next.duration = 'Minutes must be 0\u201359.'
    }

    const total = getTotalMinutes()
    if (!next.duration && total <= 0) {
      next.duration = 'Duration must be greater than 0.'
    } else if (!next.duration && total > 20160) {
      next.duration = 'Duration cannot exceed 2 weeks (20,160 minutes).'
    }

    if (!date) next.date = 'Date is required.'
    if (notes.trim().length > 2000) next.notes = 'Notes must be 2,000 characters or less.'
    setErrors(next)
    if (Object.keys(next).length > 0) return false

    if (total > 1440 && !durationConfirmed) {
      setShowDurationWarning(true)
      return false
    }

    return true
  }

  async function doSubmit() {
    setSubmitting(true)
    try {
      await onSubmit({
        subject: subject.trim(),
        duration: getTotalMinutes(),
        notes: notes.trim(),
        date: new Date(date + 'T00:00:00'),
        color,
        status,
      })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate() || submitting) return
    await doSubmit()
  }

  async function confirmDuration() {
    setDurationConfirmed(true)
    setShowDurationWarning(false)
    await doSubmit()
  }

  return (
    <>
      <form
        className="session-form"
        onSubmit={handleSubmit}
        noValidate
        aria-label={editing ? 'Edit session' : 'Add session'}
      >
        <h2>{editing ? 'Edit Session' : 'Add Session'}</h2>

        <label htmlFor={`${id}-subject`}>
          Subject
          <input
            id={`${id}-subject`}
            type="text"
            value={subject}
            onChange={(e) => {
              const val = e.target.value
              setSubject(val)
              if (classMap && classMap[val.trim()]) setColor(classMap[val.trim()])
            }}
            maxLength={40}
            list={`${id}-subject-suggestions`}
            placeholder="e.g., Math, Biology"
            aria-required="true"
            aria-describedby={errors.subject ? `${id}-subject-error` : undefined}
            aria-invalid={errors.subject ? true : undefined}
            autoComplete="off"
          />
          {classMap && Object.keys(classMap).length > 0 && (
            <datalist id={`${id}-subject-suggestions`}>
              {Object.keys(classMap).sort().map((s) => <option key={s} value={s} />)}
            </datalist>
          )}
          {errors.subject && <p className="field-error" id={`${id}-subject-error`} role="alert">{errors.subject}</p>}
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
                aria-pressed={color === c.value}
                title={c.label}
              />
            ))}
            <label className="color-custom" title="Custom color">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom color"
              />
              <span className="color-custom-swatch" style={{ backgroundColor: color }} />
            </label>
          </div>
        </fieldset>

        <div className="session-form-row">
          <label htmlFor={`${id}-hours`}>
            Duration
            <div className="duration-inputs">
              <div className="duration-field">
                <input
                  id={`${id}-hours`}
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => { setHours(e.target.value); resetDurationConfirmed() }}
                  aria-label="Hours"
                  aria-describedby={errors.duration ? `${id}-duration-error` : undefined}
                  aria-invalid={errors.duration ? true : undefined}
                />
                <span className="duration-unit">h</span>
              </div>
              <div className="duration-field">
                <input
                  id={`${id}-minutes`}
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
            {errors.duration && <p className="field-error" id={`${id}-duration-error`} role="alert">{errors.duration}</p>}
          </label>

          <label htmlFor={`${id}-date`}>
            Date
            <input
              id={`${id}-date`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-required="true"
              aria-describedby={errors.date ? `${id}-date-error` : undefined}
              aria-invalid={errors.date ? true : undefined}
            />
            {errors.date && <p className="field-error" id={`${id}-date-error`} role="alert">{errors.date}</p>}
          </label>
        </div>

        <label htmlFor={`${id}-status`}>
          Status
          <select id={`${id}-status`} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>

        <label htmlFor={`${id}-notes`}>
          Notes (optional)
          <textarea
            id={`${id}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
            aria-describedby={errors.notes ? `${id}-notes-error` : undefined}
            aria-invalid={errors.notes ? true : undefined}
          />
          {errors.notes && <p className="field-error" id={`${id}-notes-error`} role="alert">{errors.notes}</p>}
        </label>

        {formError && <p className="form-error" role="alert">{formError}</p>}

        <div className="session-form-actions">
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? (editing ? 'Saving\u2026' : 'Adding\u2026')
              : (editing ? 'Save Changes' : 'Add Session')}
          </button>
        </div>
      </form>

      <DurationWarningModal
        open={showDurationWarning}
        onCancel={() => setShowDurationWarning(false)}
        onConfirm={confirmDuration}
        duration={getTotalMinutes()}
        formId={id}
      />
    </>
  )
}
