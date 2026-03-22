import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="landing">
      <header className="hero">
        <h1 className="app-name">StudyStats</h1>
        <p className="tagline">Plan sessions, track deadlines, study smarter</p>
        <p className="description">
          StudyStats enables students and scholars to boost productivity and
          study habits. Users can track study sessions, manage deadlines, use a
          Pomodoro timer, and view weekly progress summarizing total hours
          studied, sessions completed, and due dates.
        </p>
        {currentUser ? (
          <button className="cta-button" onClick={() => navigate('/sessions')}>
            Start Studying
          </button>
        ) : (
          <button className="cta-button" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        )}
      </header>

      <section className="features" aria-label="App features">
        <div className="feature-card" onClick={() => navigate('/dashboard')} onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')} role="link" tabIndex={0}>
          <span className="feature-icon" aria-hidden="true">&#128202;</span>
          <h3>Weekly Progress</h3>
          <p>Review hours studied, sessions completed, and upcoming dates.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/sessions')} onKeyDown={(e) => e.key === 'Enter' && navigate('/sessions')} role="link" tabIndex={0}>
          <span className="feature-icon" aria-hidden="true">&#128214;</span>
          <h3>Track Sessions</h3>
          <p>Log every study session and watch your consistency grow.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/assignments')} onKeyDown={(e) => e.key === 'Enter' && navigate('/assignments')} role="link" tabIndex={0}>
          <span className="feature-icon" aria-hidden="true">&#128203;</span>
          <h3>Manage Deadlines</h3>
          <p>Stay on top of assignments with organized due-date tracking.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/pomodoro')} onKeyDown={(e) => e.key === 'Enter' && navigate('/pomodoro')} role="link" tabIndex={0}>
          <span className="feature-icon" aria-hidden="true">&#9202;</span>
          <h3>Pomodoro Timer</h3>
          <p>Stay focused with built-in timed study intervals.</p>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 StudyStats. Built for focused learners.</p>
      </footer>
    </div>
  )
}
