import { memo } from 'react'
import { formatDueLabel, formatDuration, getUrgency } from '../utils/format'
import NotesPreview from './NotesPreview'

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

      <div className="assignment-card-meta">
        <div className="assignment-card-meta-row">
          {urgency && (
            <span className={`material-symbols-outlined urgency-icon urgency-${urgency}`} aria-hidden="true">
              warning
            </span>
          )}
          <span className={`assignment-due-date${urgency ? ` urgency-${urgency}` : ''}`}>
            {formatDueLabel(urgency, a.dueDate)}
          </span>
        </div>
        {(logged > 0 || !a.completed) && (
          <div className="assignment-card-meta-row">
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
            {!a.completed && logged > 0 && (
              <span className="assignment-meta-sep" aria-hidden="true">&bull;</span>
            )}
            {logged > 0 && (
              <span className="assignment-logged">
                {formatDuration(logged)} logged
              </span>
            )}
          </div>
        )}
      </div>

      {a.notes?.trim() && (
        <NotesPreview
          text={a.notes}
          wrapperClassName="assignment-card-notes-wrapper"
          textClassName="assignment-card-notes"
        />
      )}
    </li>
  )
}

export default memo(AssignmentCard)
