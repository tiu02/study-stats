import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAssignments } from '../hooks/useFirestore'
import AssignmentForm from '../components/AssignmentForm'
import Modal from '../components/Modal'
import { formatDate, formatDuration, getUrgency } from '../utils/format'
import './Assignments.css'

export default function Assignments() {
  const { currentUser } = useAuth()
  const { assignments, loading, error, add, update, remove } = useAssignments(currentUser?.uid)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deletingAssignment, setDeletingAssignment] = useState(null)
  const [duplicateData, setDuplicateData] = useState(null)
  const [formError, setFormError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const addBtnRef = useRef(null)
  const editTriggerRef = useRef(null)
  const deleteTriggerRef = useRef(null)

  /* Class name → color map for autocomplete + auto-color */
  const classMap = useMemo(() => {
    const map = {}
    assignments.forEach((a) => {
      if (a.subject && a.color) map[a.subject] = a.color
    })
    return map
  }, [assignments])

  /* Split into active and completed */
  const active = useMemo(
    () => assignments.filter((a) => !a.completed),
    [assignments]
  )
  const completed = useMemo(
    () => assignments.filter((a) => a.completed),
    [assignments]
  )

  const closeEdit = useCallback(() => {
    setEditingAssignment(null)
    setFormError(null)
    setTimeout(() => editTriggerRef.current?.focus())
  }, [])

  const closeDelete = useCallback(() => {
    setDeletingAssignment(null)
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
    const result = await update(editingAssignment.id, data)
    if (result.ok) {
      setFormError(null)
      setEditingAssignment(null)
      setTimeout(() => editTriggerRef.current?.focus())
    } else {
      setFormError(result.error || 'Something went wrong. Please try again.')
    }
  }

  async function confirmDelete() {
    setDeleteSubmitting(true)
    const result = await remove(deletingAssignment.id)
    setDeleteSubmitting(false)
    if (result.ok) {
      setDeleteError(null)
      setDeletingAssignment(null)
    } else {
      setDeleteError(result.error || 'Could not delete assignment. Please try again.')
    }
  }

  async function toggleComplete(assignment) {
    await update(assignment.id, { completed: !assignment.completed })
  }

  /* Duplicate as template — pre-fill with today's date, clear completed */
  function duplicateAsTemplate(assignment) {
    setFormError(null)
    setEditingAssignment(null)
    setShowAddModal(true)
    /* Store template data on the add modal — handled via duplicateData state */
    setDuplicateData({
      subject: assignment.subject,
      title: assignment.title,
      color: assignment.color,
    })
  }

  function openAddModal() {
    setFormError(null)
    setDuplicateData(null)
    setShowAddModal(true)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setFormError(null)
    setDuplicateData(null)
    setTimeout(() => addBtnRef.current?.focus())
  }

  if (loading) {
    return (
      <div className="loading-spinner" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true"></span>
        Loading assignments&hellip;
      </div>
    )
  }

  return (
    <div className="assignments-page">
      <div className="assignments-header">
        <h1>Assignments</h1>
        <button className="btn-add" ref={addBtnRef} onClick={openAddModal}>
          <span className="material-symbols-outlined btn-add-icon" aria-hidden="true">add</span>
          Add Assignment
        </button>
      </div>

      {error && <p className="assignments-error" role="alert">{error}</p>}

      {/* Add modal */}
      <Modal open={showAddModal} onClose={closeAddModal} ariaLabel="Add assignment">
        <AssignmentForm
          onSubmit={handleAdd}
          onCancel={closeAddModal}
          classMap={classMap}
          formId="add-assignment"
          formError={formError}
          initialData={duplicateData}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editingAssignment} onClose={closeEdit} ariaLabel={`Edit: ${editingAssignment?.title || 'assignment'}`}>
        {editingAssignment && (
          <AssignmentForm
            initialData={editingAssignment}
            onSubmit={handleUpdate}
            onCancel={closeEdit}
            classMap={classMap}
            formId="edit-assignment"
            formError={formError}
          />
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deletingAssignment}
        onClose={closeDelete}
        ariaLabel={`Delete ${deletingAssignment?.title || 'assignment'}`}
        ariaDescribedBy="delete-assignment-desc"
        role="alertdialog"
        className="modal-overlay-centered"
      >
        {deletingAssignment && (
          <div className="delete-modal">
            <span className="material-symbols-outlined delete-modal-icon" aria-hidden="true">delete</span>
            <h2>Delete &ldquo;{deletingAssignment.title}&rdquo;?</h2>
            <p id="delete-assignment-desc">This action cannot be undone.</p>
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

      {/* Empty state */}
      {assignments.length === 0 ? (
        <div className="assignments-empty">
          <p>No assignments yet</p>
          <p>Tap &ldquo;Add Assignment&rdquo; to track your first deadline.</p>
        </div>
      ) : (
        <>
          {/* Active assignments */}
          {active.length > 0 && (
            <ul className="assignments-list">
              {active.map((a) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  onToggleComplete={() => toggleComplete(a)}
                  onEdit={(e) => { editTriggerRef.current = e.currentTarget; setFormError(null); setEditingAssignment(a) }}
                  onDuplicate={() => duplicateAsTemplate(a)}
                  onDelete={(e) => { deleteTriggerRef.current = e.currentTarget; setDeleteError(null); setDeletingAssignment(a) }}
                />
              ))}
            </ul>
          )}

          {/* All caught up — no active assignments but completed ones exist */}
          {active.length === 0 && completed.length > 0 && (
            <div className="assignments-empty">
              <p>All caught up!</p>
              <p>All assignments are complete.</p>
            </div>
          )}

          {/* Completed section with show more/less toggle */}
          {completed.length > 0 && (
            <div className="completed-section">
              <button
                type="button"
                className="completed-toggle"
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
              >
                <span className="completed-toggle-label">
                  Completed ({completed.length})
                </span>
                <span className={`material-symbols-outlined completed-chevron${showCompleted ? ' open' : ''}`} aria-hidden="true">
                  expand_more
                </span>
              </button>
              {showCompleted && (
                <ul className="assignments-list">
                  {completed.map((a) => (
                    <AssignmentCard
                      key={a.id}
                      assignment={a}
                      onToggleComplete={() => toggleComplete(a)}
                      onEdit={(e) => { editTriggerRef.current = e.currentTarget; setFormError(null); setEditingAssignment(a) }}
                      onDuplicate={() => duplicateAsTemplate(a)}
                      onDelete={(e) => { deleteTriggerRef.current = e.currentTarget; setDeleteError(null); setDeletingAssignment(a) }}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ===== Assignment Card ===== */

function AssignmentCard({ assignment, onToggleComplete, onEdit, onDuplicate, onDelete }) {
  const a = assignment
  const color = a.color || '#6366F1'
  const urgency = a.completed ? null : getUrgency(a.dueDate)
  const logged = a.totalMinutesLogged || 0

  return (
    <li className={`assignment-card${a.completed ? ' completed' : ''}`} style={{ borderLeftColor: color }}>
      {/* Row 1: Checkbox + class pill + title + actions */}
      <div className="assignment-card-top">
        <label className="assignment-checkbox-label">
          <input
            type="checkbox"
            checked={a.completed}
            onChange={onToggleComplete}
            aria-label={`Mark "${a.title}" as ${a.completed ? 'incomplete' : 'complete'}`}
            className="assignment-checkbox"
          />
          <span className="assignment-checkbox-custom" />
        </label>
        <div className="assignment-card-info">
          <div className="assignment-card-title-row">
            <span
              className="class-badge"
              style={{ backgroundColor: color, color: '#ffffff' }}
              title={a.subject}
            >
              {a.subject}
            </span>
            <h2 className="assignment-card-title" title={a.title}>{a.title}</h2>
          </div>
        </div>
        <div className="assignment-card-actions">
          <button className="btn-icon" onClick={onEdit} aria-label={`Edit ${a.title}`} title="Edit">
            <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
          <button className="btn-icon" onClick={onDuplicate} aria-label={`Duplicate ${a.title}`} title="Duplicate as template">
            <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
          </button>
          <button className="btn-icon btn-icon-delete" onClick={onDelete} aria-label={`Delete ${a.title}`} title="Delete">
            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>

      {/* Row 2: Due date with urgency indicator */}
      <div className="assignment-card-meta">
        {urgency && (
          <span className={`material-symbols-outlined urgency-icon urgency-${urgency}`} aria-hidden="true">warning</span>
        )}
        <span className={`assignment-due-date${urgency ? ` urgency-${urgency}` : ''}`}>
          {urgency === 'overdue' && 'Overdue \u2014 '}
          Due {formatDate(a.dueDate)}
        </span>
        {logged > 0 && (
          <>
            <span className="assignment-meta-sep" aria-hidden="true">&bull;</span>
            <span className="assignment-logged">
              <span className="material-symbols-outlined assignment-logged-icon" aria-hidden="true">timer</span>
              {formatDuration(logged)} logged
            </span>
          </>
        )}
      </div>

      {/* Pomodoro timer placeholder — Phase 7 */}
      {!a.completed && (
        <div className="pomodoro-placeholder" aria-hidden="true">
          <span className="material-symbols-outlined pomodoro-placeholder-icon">timer</span>
          <span className="pomodoro-placeholder-text">Pomodoro timer — coming in Phase 7</span>
        </div>
      )}
    </li>
  )
}
