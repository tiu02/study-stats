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
        <h1 className="app-name">StudyStats</h1>
        <p className="tagline">Plan sessions, track deadlines, study smarter</p>
        <p className="description">
          StudyStats enables students and scholars to boost productivity and
          study habits. Users can track study sessions, manage deadlines, use a
          Pomodoro timer, and view weekly progress summarizing total hours
          studied, sessions completed, and due dates.
        </p>
        <button className="cta-button" onClick={() => navigate('/signup')}>
          Get Started
        </button>
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
