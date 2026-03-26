import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAssignments } from '../hooks/useFirestore'
import AssignmentForm from '../components/AssignmentForm'
import Modal from '../components/Modal'
import PomodoroTimer from '../components/PomodoroTimer'
import { formatDate, formatDuration, getUrgency } from '../utils/format'
import './Assignments.css'

export default function Assignments() {
  const { currentUser } = useAuth()
  const { assignments, loading, error, add, update, remove, refresh } = useAssignments(currentUser?.uid)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [deletingAssignment, setDeletingAssignment] = useState(null)
  const [duplicateData, setDuplicateData] = useState(null)
  const [formError, setFormError] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Timer modal state
  const [timerAssignment, setTimerAssignment] = useState(null)
  const [autoStart, setAutoStart] = useState(false)

  // Single-timer enforcement
  const [activeTimerId, setActiveTimerId] = useState(null)
  const [pendingStartId, setPendingStartId] = useState(null)
  // Ref map for forceStop (only the open modal's timer is in here)
  const timerRefs = useRef({})

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
  const active = useMemo(() => assignments.filter((a) => !a.completed), [assignments])
  const completed = useMemo(() => assignments.filter((a) => a.completed), [assignments])

  /* Names for the conflict modal */
  const activeAssignment = assignments.find((a) => a.id === activeTimerId)
  const pendingAssignment = assignments.find((a) => a.id === pendingStartId)

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
    // If completing an assignment whose timer is running, stop it first
    if (!assignment.completed && assignment.id === activeTimerId) {
      timerRefs.current[activeTimerId]?.forceStop()
      setTimerAssignment(null)
      setAutoStart(false)
    }
    await update(assignment.id, { completed: !assignment.completed })
  }

  /* Duplicate as template */
  function duplicateAsTemplate(assignment) {
    setFormError(null)
    setEditingAssignment(null)
    setDuplicateData({ subject: assignment.subject, title: assignment.title, color: assignment.color })
    setShowAddModal(true)
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

  /* Timer modal */
  function openTimerModal(assignment) {
    if (activeTimerId && activeTimerId !== assignment.id) {
      // Another timer is running — show conflict modal
      setPendingStartId(assignment.id)
    } else {
      setAutoStart(false)
      setTimerAssignment(assignment)
    }
  }

  function closeTimerModal() {
    // forceStop cleans up the running/paused state and calls onTimerStop
    if (timerAssignment) {
      timerRefs.current[timerAssignment.id]?.forceStop()
    }
    setTimerAssignment(null)
    setAutoStart(false)
  }

  function confirmStopAndStart() {
    const nextAssignment = assignments.find((a) => a.id === pendingStartId)
    // Stop the running timer (in the currently open modal)
    timerRefs.current[activeTimerId]?.forceStop()
    // Open the new assignment's modal and auto-start its timer
    setActiveTimerId(pendingStartId)
    setAutoStart(true)
    setTimerAssignment(nextAssignment)
    setPendingStartId(null)
  }

  function cancelTimerConflict() {
    setPendingStartId(null)
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
      <Modal
        open={!!editingAssignment}
        onClose={closeEdit}
        ariaLabel={`Edit: ${editingAssignment?.title || 'assignment'}`}
      >
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

      {/* Timer conflict modal */}
      <Modal
        open={!!pendingStartId}
        onClose={cancelTimerConflict}
        ariaLabel="Timer already running"
        ariaDescribedBy="timer-conflict-desc"
        role="alertdialog"
        className="modal-overlay-centered"
      >
        {pendingStartId && (
          <div className="delete-modal">
            <span className="material-symbols-outlined delete-modal-icon timer-conflict-icon" aria-hidden="true">
              timer
            </span>
            <h2>Timer already running</h2>
            <p id="timer-conflict-desc">
              A timer is running on{' '}
              <strong>&ldquo;{activeAssignment?.title || 'another assignment'}&rdquo;</strong>.
              Stop it and start the timer on{' '}
              <strong>&ldquo;{pendingAssignment?.title || 'this assignment'}&rdquo;</strong>?
            </p>
            <div className="delete-modal-actions">
              <button className="btn-secondary" onClick={cancelTimerConflict}>Keep running</button>
              <button className="btn-confirm-stop-start" onClick={confirmStopAndStart}>
                Stop &amp; Start
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Timer modal — single shared modal for all assignment timers */}
      <Modal
        open={!!timerAssignment}
        onClose={closeTimerModal}
        ariaLabel={`Timer — ${timerAssignment?.title || 'assignment'}`}
        className="modal-overlay-centered"
      >
        {timerAssignment && (
          <div className="pomodoro-modal-box">
            <div className="pomodoro-modal-header">
              <span
                className="class-badge"
                style={{ backgroundColor: timerAssignment.color || '#6366F1', color: '#ffffff' }}
                title={timerAssignment.subject}
              >
                {timerAssignment.subject}
              </span>
              <h2 className="pomodoro-modal-title" title={timerAssignment.title}>
                {timerAssignment.title}
              </h2>
            </div>
            <PomodoroTimer
              key={timerAssignment.id}
              ref={(el) => {
                if (el) timerRefs.current[timerAssignment.id] = el
                else delete timerRefs.current[timerAssignment.id]
              }}
              assignment={timerAssignment}
              uid={currentUser?.uid}
              onSessionLogged={refresh}
              activeTimerId={activeTimerId}
              onTimerStart={(id) => setActiveTimerId(id)}
              onTimerStop={() => setActiveTimerId(null)}
              vertical
              autoStart={autoStart}
            />
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
                  isActive={activeTimerId === a.id}
                  onTimerOpen={() => openTimerModal(a)}
                />
              ))}
            </ul>
          )}

          {/* All caught up */}
          {active.length === 0 && completed.length > 0 && (
            <div className="assignments-empty">
              <p>All caught up!</p>
              <p>All assignments are complete.</p>
            </div>
          )}

          {/* Completed section */}
          {completed.length > 0 && (
            <div className="completed-section">
              <button
                type="button"
                className="completed-toggle"
                onClick={() => setShowCompleted(!showCompleted)}
                aria-expanded={showCompleted}
              >
                <span className="completed-toggle-label">Completed ({completed.length})</span>
                <span
                  className={`material-symbols-outlined completed-chevron${showCompleted ? ' open' : ''}`}
                  aria-hidden="true"
                >
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

function AssignmentCard({
  assignment,
  onToggleComplete,
  onEdit,
  onDuplicate,
  onDelete,
  isActive,
  onTimerOpen,
}) {
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
          {!a.completed && (
            <button
              type="button"
              className={`assignment-timer-btn${isActive ? ' active' : ''}`}
              onClick={onTimerOpen}
              aria-label={`Open timer for ${a.title}`}
              title="Focus Timer"
            >
              {isActive && <span className="assignment-timer-btn-dot" aria-hidden="true" />}
              <span className="material-symbols-outlined" aria-hidden="true">timer</span>
              Timer
            </button>
          )}
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

      {/* Row 2: Due date + urgency + logged time + Timer button */}
      <div className="assignment-card-meta">
        {urgency && (
          <span className={`material-symbols-outlined urgency-icon urgency-${urgency}`} aria-hidden="true">
            warning
          </span>
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
    </li>
  )
}
