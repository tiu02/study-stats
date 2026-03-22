import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Landing() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

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
          <>
            <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
              Signed in as {currentUser.email}
            </p>
            <button className="cta-button" style={{ marginRight: '0.75rem' }}>
              Start Studying
            </button>
            <button
              className="cta-button"
              onClick={handleLogout}
              style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="cta-button" style={{ marginRight: '0.75rem', textDecoration: 'none', display: 'inline-block' }}>
              Log In
            </Link>
            <Link to="/signup" className="cta-button" style={{ backgroundColor: '#e5e7eb', color: '#374151', textDecoration: 'none', display: 'inline-block' }}>
              Sign Up
            </Link>
          </>
        )}
      </header>

      <section className="features">
        <div className="feature-card">
          <h3>Track Sessions</h3>
          <p>Log every study session and watch your consistency grow.</p>
        </div>
        <div className="feature-card">
          <h3>Manage Deadlines</h3>
          <p>Stay on top of assignments with organized due-date tracking.</p>
        </div>
        <div className="feature-card">
          <h3>Pomodoro Timer</h3>
          <p>Stay focused with built-in timed study intervals.</p>
        </div>
        <div className="feature-card">
          <h3>Weekly Progress</h3>
          <p>Review hours studied, sessions completed, and upcoming dates.</p>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 StudyStats. Built for focused learners.</p>
      </footer>
    </div>
  )
}
