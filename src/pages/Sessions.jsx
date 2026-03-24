import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useSessions } from '../hooks/useFirestore'
import SessionForm from '../components/SessionForm'
import './Sessions.css'

function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatDate(value) {
  if (!value) return ''
  const d = typeof value.toDate === 'function' ? value.toDate() : new Date(value)
  return format(d, 'MMM d, yyyy')
}

const STATUS_LABELS = {
  'complete': 'Complete',
  'in-progress': 'In Progress',
  'incomplete': 'Incomplete',
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
}

function cardBackground(hex) {
  const rgb = hexToRgb(hex || '#6366F1')
  if (!rgb) return undefined
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`
}

/* Modal component — shared by Add, Edit, Delete */
function Modal({ open, onClose, ariaLabel, ariaDescribedBy, role, className, children }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!open) return

    // Focus trap: focus the modal content on open
    const el = contentRef.current
    if (el) el.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Trap focus within modal
      if (e.key === 'Tab' && el) {
        const focusable = el.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className={`modal-overlay${className ? ` ${className}` : ''}`} ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className="modal-content"
        ref={contentRef}
        role={role || 'dialog'}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-modal="true"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}

/* Notes with 3-line clamp and "Show more" toggle (R9) */
function NotesPreview({ text }) {
  const [expanded, setExpanded] = useState(false)
  const textRef = useRef(null)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div className="session-card-notes-wrapper">
      <p
        ref={expanded ? null : textRef}
        className={`session-card-notes${expanded ? '' : ' clamped'}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          className="btn-show-more"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

export default function Sessions() {
  const { currentUser } = useAuth()
  const { sessions, loading, error, add, update, remove } = useSessions(currentUser?.uid)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [deletingSession, setDeletingSession] = useState(null)
  const [formError, setFormError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const addBtnRef = useRef(null)
  const editTriggerRef = useRef(null)
  const deleteTriggerRef = useRef(null)

  const uniqueSubjects = useMemo(
    () => [...new Set(sessions.map((s) => s.subject))].sort(),
    [sessions]
  )

  const closeAdd = useCallback(() => {
    setShowAddModal(false)
    setFormError(null)
    setTimeout(() => addBtnRef.current?.focus())
  }, [])

  const closeEdit = useCallback(() => {
    setEditingSession(null)
    setFormError(null)
    setTimeout(() => editTriggerRef.current?.focus())
  }, [])

  const closeDelete = useCallback(() => {
    setDeletingSession(null)
    setDeleteError(null)
    setTimeout(() => deleteTriggerRef.current?.focus())
  }, [])

  async function handleAdd(data) {
    const result = await add(data)
    if (result.ok) {
      setFormError(null)
      setShowAddModal(false)
      setTimeout(() => addBtnRef.current?.focus())
    } else {
      setFormError(result.error || 'Something went wrong. Please try again.')
    }
  }

  async function handleUpdate(data) {
    const result = await update(editingSession.id, data)
    if (result.ok) {
      setFormError(null)
      setEditingSession(null)
      setTimeout(() => editTriggerRef.current?.focus())
    } else {
      setFormError(result.error || 'Something went wrong. Please try again.')
    }
  }

  async function confirmDelete() {
    setDeleteSubmitting(true)
    const result = await remove(deletingSession.id)
    setDeleteSubmitting(false)
    if (result.ok) {
      setDeleteError(null)
      setDeletingSession(null)
    } else {
      setDeleteError(result.error || 'Could not delete session. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true"></span>
        Loading sessions&hellip;
      </div>
    )
  }

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1>Sessions</h1>
        <button className="btn-add" ref={addBtnRef} onClick={() => { setFormError(null); setShowAddModal(true) }}>
          <span className="material-symbols-outlined btn-add-icon" aria-hidden="true">add</span>
          Add Session
        </button>
      </div>

      {error && <p className="sessions-error" role="alert">{error}</p>}

      {/* Add modal (R15) */}
      <Modal open={showAddModal} onClose={closeAdd} ariaLabel="Add session">
        <SessionForm
          onSubmit={handleAdd}
          onCancel={closeAdd}
          subjects={uniqueSubjects}
          formId="add"
          formError={formError}
        />
      </Modal>

      {/* Edit modal (R11) */}
      <Modal open={!!editingSession} onClose={closeEdit} ariaLabel={`Edit: ${editingSession?.subject || 'session'}`}>
        {editingSession && (
          <SessionForm
            initialData={editingSession}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
            subjects={uniqueSubjects}
            formId="edit"
            formError={formError}
          />
        )}
      </Modal>

      {/* Delete modal (R10, A3) */}
      <Modal
        open={!!deletingSession}
        onClose={closeDelete}
        ariaLabel={`Delete ${deletingSession?.subject || 'session'}`}
        ariaDescribedBy="delete-modal-desc"
        role="alertdialog"
        className="modal-overlay-centered"
      >
        {deletingSession && (
          <div className="delete-modal">
            <span className="material-symbols-outlined delete-modal-icon" aria-hidden="true">delete</span>
            <h2>Delete &ldquo;{deletingSession.subject}&rdquo;?</h2>
            <p id="delete-modal-desc">This action cannot be undone.</p>
            {deleteError && <p className="delete-modal-error" role="alert">{deleteError}</p>}
            <div className="delete-modal-actions">
              <button className="btn-secondary" onClick={closeDelete} disabled={deleteSubmitting}>Cancel</button>
              <button className="btn-confirm-delete" onClick={confirmDelete} disabled={deleteSubmitting}>
                {deleteSubmitting ? 'Deleting\u2026' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {sessions.length === 0 ? (
        <div className="sessions-empty">
          <p>No sessions yet</p>
          <p>Tap &ldquo;Add Session&rdquo; to log your first study session.</p>
        </div>
      ) : (
        <ul className="sessions-list">
          {sessions.map((session) => {
            const color = session.color || '#6366F1'
            const statusKey = session.status || 'complete'

            return (
              <li
                key={session.id}
                className="session-card"
                style={{
                  borderLeftColor: color,
                  backgroundColor: cardBackground(color),
                }}
              >
                {/* Row 1: Subject + status badge + actions */}
                <div className="session-card-top">
                  <div className="session-card-title-group">
                    <h2 className="session-card-subject" title={session.subject}>{session.subject}</h2>
                    <span className={`status-badge status-${statusKey}`}>
                      {STATUS_LABELS[statusKey] || 'Complete'}
                    </span>
                  </div>
                  <div className="session-card-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => { editTriggerRef.current = e.currentTarget; setFormError(null); setEditingSession(session) }}
                      aria-label={`Edit ${session.subject}`}
                      title="Edit"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={(e) => { deleteTriggerRef.current = e.currentTarget; setDeleteError(null); setDeletingSession(session) }}
                      aria-label={`Delete ${session.subject}`}
                      title="Delete"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Date + duration */}
                <div className="session-card-meta">
                  <span className="session-card-date">{formatDate(session.date)}</span>
                  <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                  <span className="session-card-duration">{formatDuration(session.duration)}</span>
                </div>

                {/* Row 3: Notes (clamped) */}
                {session.notes && <NotesPreview text={session.notes} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
