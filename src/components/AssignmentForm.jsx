import { useState } from 'react'
import { format } from 'date-fns'
import './AssignmentForm.css'

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

function toDateString(value) {
  if (!value) return today()
  if (typeof value.toDate === 'function') return format(value.toDate(), 'yyyy-MM-dd')
  if (value instanceof Date) return format(value, 'yyyy-MM-dd')
  return String(value)
}

export default function AssignmentForm({ onSubmit, onCancel, initialData, classMap, formId, formError }) {
  const editing = Boolean(initialData?.id)
  const id = formId || (editing ? 'edit-assignment' : 'add-assignment')

  const [subject, setSubject] = useState(initialData?.subject || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [dueDate, setDueDate] = useState(toDateString(initialData?.dueDate))
  const [color, setColor] = useState(initialData?.color || '#6366F1')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  /* Auto-select color when a known class is typed */
  function handleSubjectChange(e) {
    const val = e.target.value
    setSubject(val)
    if (classMap && classMap[val.trim()]) {
      setColor(classMap[val.trim()])
    }
  }

  function validate() {
    const next = {}
    if (!subject.trim()) next.subject = 'Class/subject is required.'
    else if (subject.trim().length > 40) next.subject = 'Class/subject must be 40 characters or less.'

    if (!title.trim()) next.title = 'Assignment title is required.'
    else if (title.trim().length > 200) next.title = 'Title must be 200 characters or less.'

    if (!dueDate) next.dueDate = 'Due date is required.'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({
        subject: subject.trim(),
        title: title.trim(),
        dueDate: new Date(dueDate + 'T00:00:00'),
        color,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const subjectNames = classMap ? Object.keys(classMap).sort() : []

  return (
    <form
      className="assignment-form"
      onSubmit={handleSubmit}
      noValidate
      aria-label={editing ? 'Edit assignment' : 'Add assignment'}
    >
      <h2>{editing ? 'Edit Assignment' : 'Add Assignment'}</h2>

      <label htmlFor={`${id}-subject`}>
        Class / Subject
        <input
          id={`${id}-subject`}
          type="text"
          value={subject}
          onChange={handleSubjectChange}
          maxLength={40}
          list={`${id}-subject-suggestions`}
          placeholder="e.g., Mathematics, Biology"
          aria-required="true"
          aria-describedby={errors.subject ? `${id}-subject-error` : undefined}
          aria-invalid={errors.subject ? true : undefined}
          autoComplete="off"
        />
        {subjectNames.length > 0 && (
          <datalist id={`${id}-subject-suggestions`}>
            {subjectNames.map((s) => <option key={s} value={s} />)}
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
            <span className="color-custom-swatch" style={{ backgroundColor: color }}>
              <span className="material-symbols-outlined color-custom-icon" aria-hidden="true">colorize</span>
            </span>
          </label>
        </div>
      </fieldset>

      <label htmlFor={`${id}-title`}>
        Assignment Title
        <input
          id={`${id}-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="e.g., Chapter 5 Homework"
          aria-required="true"
          aria-describedby={errors.title ? `${id}-title-error` : undefined}
          aria-invalid={errors.title ? true : undefined}
        />
        {errors.title && <p className="field-error" id={`${id}-title-error`} role="alert">{errors.title}</p>}
      </label>

      <label htmlFor={`${id}-dueDate`}>
        Due Date
        <input
          id={`${id}-dueDate`}
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-required="true"
          aria-describedby={errors.dueDate ? `${id}-dueDate-error` : undefined}
          aria-invalid={errors.dueDate ? true : undefined}
        />
        {errors.dueDate && <p className="field-error" id={`${id}-dueDate-error`} role="alert">{errors.dueDate}</p>}
      </label>

      {formError && <p className="form-error" role="alert">{formError}</p>}

      <div className="assignment-form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting
            ? (editing ? 'Saving\u2026' : 'Adding\u2026')
            : (editing ? 'Save Changes' : 'Add Assignment')}
        </button>
      </div>
    </form>
  )
}
