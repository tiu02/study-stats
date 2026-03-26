import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSessions } from '../hooks/useFirestore'
import SessionForm from '../components/SessionForm'
import Modal from '../components/Modal'
import { formatDuration, formatDate, STATUS_LABELS } from '../utils/format'
import './Sessions.css'

const STATUS_ICONS = {
  'complete': 'check_circle',
  'in-progress': 'pending',
  'incomplete': 'cancel',
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

  const classMap = useMemo(() => {
    const map = {}
    sessions.forEach((s) => { if (s.subject && s.color && !map[s.subject]) map[s.subject] = s.color })
    return map
  }, [sessions])

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
          classMap={classMap}
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
            classMap={classMap}
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
                style={{ borderLeftColor: color }}
              >
                {/* Row 1: Class badge + status icon + actions */}
                <div className="session-card-top">
                  <div className="session-card-title-group">
                    <span
                      className="class-dot"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                      title={session.subject}
                    />
                    <h2 className="session-card-subject">{session.subject}</h2>
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

                {/* Row 2: Date + duration + status + Pomodoro badge (if auto-logged) */}
                <div className="session-card-meta">
                  <span className="session-card-date">{formatDate(session.date)}</span>
                  <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                  <span className="session-card-duration">{formatDuration(session.duration)}</span>
                  <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                  <span
                    role="img"
                    aria-label={STATUS_LABELS[statusKey] || 'Complete'}
                    className={`material-symbols-outlined status-icon status-icon-${statusKey}`}
                  >
                    {STATUS_ICONS[statusKey] || 'check_circle'}
                  </span>
                  {session.assignmentId && (
                    <>
                      <span className="session-card-meta-sep" aria-hidden="true">&bull;</span>
                      <span className="session-pomodoro-badge" aria-label="Logged via Pomodoro">
                        <span className="material-symbols-outlined session-pomodoro-icon" aria-hidden="true">timer</span>
                        Pomodoro
                      </span>
                    </>
                  )}
                </div>

                {/* Row 3: Notes (clamped) */}
                {session.notes?.trim() && <NotesPreview text={session.notes} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
