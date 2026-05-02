import { useNavigate } from 'react-router-dom'
import { formatDate, formatDuration, STATUS_LABELS, STATUS_ICONS } from '../utils/format'

export default function DashboardSessionCard({ session }) {
  const navigate = useNavigate()
  const statusKey = session.status || 'complete'
  const color = session.color || '#6366F1'

  return (
    <li>
      <button
        className="dash-session-card"
        style={{ borderLeftColor: color }}
        onClick={() => navigate('/sessions')}
        aria-label={`${session.subject}, ${STATUS_LABELS[statusKey] || 'Complete'}, ${formatDuration(session.duration)}, ${formatDate(session.date)}. Go to Sessions.`}
      >
        <span
          aria-hidden="true"
          className={`material-symbols-outlined dash-status-icon dash-status-${statusKey}`}
        >
          {STATUS_ICONS[statusKey] || 'check_circle'}
        </span>
        <span className="dash-session-subject" style={{ borderBottomColor: color }}>
          {session.subject}
        </span>
        <span className="dash-sep" aria-hidden="true">&middot;</span>
        <span className="dash-session-meta">
          <span className="dash-date">{formatDate(session.date)}</span>
          <span className="dash-sep" aria-hidden="true">&middot;</span>
          <span className="dash-duration">{formatDuration(session.duration)}</span>
          {session.assignmentId && (
            <>
              <span className="dash-sep" aria-hidden="true">&middot;</span>
              <span className="dash-pomodoro-badge">
                <span className="material-symbols-outlined dash-pomodoro-icon" aria-hidden="true">timer</span>
                Pomodoro
              </span>
            </>
          )}
        </span>
      </button>
    </li>
  )
}
