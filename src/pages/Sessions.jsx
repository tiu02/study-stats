import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useSessions } from '../hooks/useFirestore'
import SessionForm from '../components/SessionForm'
import './Sessions.css'

function formatDuration(minutes) {
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

export default function Sessions() {
  const { currentUser } = useAuth()
  const { sessions, loading, error, add, update, remove } = useSessions(currentUser?.uid)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const uniqueSubjects = useMemo(
    () => [...new Set(sessions.map((s) => s.subject))].sort(),
    [sessions]
  )

  async function handleAdd(data) {
    const ok = await add(data)
    if (ok) setShowForm(false)
  }

  async function handleUpdate(data) {
    const ok = await update(editingId, data)
    if (ok) setEditingId(null)
  }

  function startEdit(session) {
    setEditingId(session.id)
    setShowForm(false)
    setDeletingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function startDelete(id) {
    setDeletingId(id)
    setEditingId(null)
  }

  async function confirmDelete() {
    const ok = await remove(deletingId)
    if (ok) setDeletingId(null)
  }

  if (loading) {
    return <div className="loading-spinner">Loading sessions…</div>
  }

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1>Sessions</h1>
        {!showForm && !editingId && (
          <button className="btn-add" onClick={() => { setShowForm(true); setDeletingId(null) }}>
            + Add Session
          </button>
        )}
      </div>

      {error && <p className="sessions-error" role="alert">{error}</p>}

      {showForm && (
        <div className="sessions-form-wrapper">
          <SessionForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            subjects={uniqueSubjects}
          />
        </div>
      )}

      {sessions.length === 0 && !showForm ? (
        <div className="sessions-empty">
          <p>No sessions yet</p>
          <p>Tap &ldquo;+ Add Session&rdquo; to log your first study session.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="session-card"
              style={{ borderLeftColor: session.color || '#6366F1' }}
            >
              {editingId === session.id ? (
                <SessionForm
                  initialData={session}
                  onSubmit={handleUpdate}
                  onCancel={cancelEdit}
                  subjects={uniqueSubjects}
                />
              ) : (
                <>
                  <div className="session-card-top">
                    <h2 className="session-card-subject">{session.subject}</h2>
                    <span className="session-card-duration">{formatDuration(session.duration)}</span>
                  </div>
                  <div className="session-card-meta">
                    <p className="session-card-date">{formatDate(session.date)}</p>
                    <span className={`status-badge status-${session.status || 'complete'}`}>
                      {STATUS_LABELS[session.status] || 'Complete'}
                    </span>
                  </div>
                  {session.notes && <p className="session-card-notes">{session.notes}</p>}

                  {deletingId === session.id ? (
                    <div className="delete-confirm">
                      <span>Delete this session?</span>
                      <button className="btn-confirm-delete" onClick={confirmDelete}>Delete</button>
                      <button className="btn-confirm-cancel" onClick={() => setDeletingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="session-card-actions">
                      <button className="btn-edit" onClick={() => startEdit(session)}>Edit</button>
                      <button className="btn-delete" onClick={() => startDelete(session.id)}>Delete</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
