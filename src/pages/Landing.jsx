import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true })
  }, [currentUser, navigate])

  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-content">
          <h1 className="app-name">StudyStats</h1>
          <p className="tagline">Plan sessions, track deadlines, study smarter</p>
          <p className="description">
            Track study sessions, manage deadlines, use a Pomodoro timer, and
            view weekly progress — all synced to the cloud in real time.
          </p>
          <button className="cta-button" onClick={() => navigate('/signup')}>
            Get Started
          </button>
        </div>

        <div className="hero-preview" aria-hidden="true">
          <div className="hero-stat-preview">
            <span className="material-symbols-outlined hero-stat-icon">schedule</span>
            <span className="hero-stat-value">14h</span>
            <span className="hero-stat-label">Hours This Week</span>
          </div>
          <div className="hero-stat-preview">
            <span className="material-symbols-outlined hero-stat-icon">menu_book</span>
            <span className="hero-stat-value">9</span>
            <span className="hero-stat-label">Sessions</span>
          </div>
          <div className="hero-stat-preview">
            <span className="material-symbols-outlined hero-stat-icon">assignment</span>
            <span className="hero-stat-value">3</span>
            <span className="hero-stat-label">Upcoming</span>
          </div>
          <div className="hero-stat-preview hero-stat-streak">
            <span className="material-symbols-outlined hero-stat-icon">local_fire_department</span>
            <span className="hero-stat-value">5</span>
            <span className="hero-stat-label">Day Streak</span>
          </div>
        </div>
      </header>

      <section className="features" aria-label="App features">
        <div className="feature-card" onClick={() => navigate('/dashboard')} onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard')} role="link" tabIndex={0}>
          <h3><span className="material-symbols-outlined feature-icon" aria-hidden="true">grid_view</span> Weekly Progress</h3>
          <p>Review hours studied, sessions completed, and upcoming dates.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/assignments')} onKeyDown={(e) => e.key === 'Enter' && navigate('/assignments')} role="link" tabIndex={0}>
          <h3><span className="material-symbols-outlined feature-icon" aria-hidden="true">assignment</span> Track Assignments</h3>
          <p>Stay on top of assignments with organized due-date tracking.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/sessions')} onKeyDown={(e) => e.key === 'Enter' && navigate('/sessions')} role="link" tabIndex={0}>
          <h3><span className="material-symbols-outlined feature-icon" aria-hidden="true">menu_book</span> Log Sessions</h3>
          <p>Log every study session and watch your consistency grow.</p>
        </div>
        <div className="feature-card" onClick={() => navigate('/assignments')} onKeyDown={(e) => e.key === 'Enter' && navigate('/assignments')} role="link" tabIndex={0}>
          <h3><span className="material-symbols-outlined feature-icon" aria-hidden="true">timer</span> Pomodoro Timer</h3>
          <p>Stay focused with timed study intervals. Access the timer from any assignment.</p>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 StudyStats. Built for focused learners.</p>
      </footer>
    </div>
  )
}
