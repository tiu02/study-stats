import { useNavigate } from 'react-router-dom'
import { formatDate, formatDueLabel, formatDuration, getUrgency } from '../utils/format'

export default function DashboardDeadlineCard({ assignment }) {
  const navigate = useNavigate()
  const urgency = getUrgency(assignment.dueDate)
  const color = assignment.color || '#6366F1'
  const logged = assignment.totalMinutesLogged || 0

  return (
    <li>
      <button
        className="dash-deadline-card"
        style={{ borderLeftColor: color }}
        onClick={() => navigate('/assignments')}
        aria-label={`${assignment.title}, ${assignment.subject}, due ${formatDate(assignment.dueDate)}. Go to Assignments.`}
      >
        <div className="dash-deadline-title-row">
          <span
            className="dash-class-pill"
            style={{ backgroundColor: color }}
            title={assignment.subject}
          >
            {assignment.subject}
          </span>
          <span className="dash-deadline-title">{assignment.title}</span>
        </div>
        <div className="dash-deadline-meta">
          {urgency && (
            <span
              className={`material-symbols-outlined dash-urgency-icon dash-urgency-${urgency}`}
              aria-hidden="true"
            >
              warning
            </span>
          )}
          <span className={`dash-due-date${urgency ? ` dash-due-${urgency}` : ''}`}>
            {formatDueLabel(urgency, assignment.dueDate)}
          </span>
          {logged > 0 && (
            <>
              <span className="dash-meta-sep" aria-hidden="true">&bull;</span>
              <span className="dash-logged">
                <span className="material-symbols-outlined dash-logged-icon" aria-hidden="true">timer</span>
                {formatDuration(logged)} logged
              </span>
            </>
          )}
        </div>
      </button>
    </li>
  )
}
