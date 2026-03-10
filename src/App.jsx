import './App.css'

function App() {
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
        <button className="cta-button">Start Studying</button>
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

export default App
