import { useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const protectedPaths = ['/dashboard', '/sessions', '/assignments', '/pomodoro']

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    if (!protectedPaths.includes(location.pathname)) {
      navigate('/')
    }
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar-top">
        <Link to="/" className="navbar-logo" onClick={handleNavClick}>StudyStats</Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      <div className={`navbar-menu ${menuOpen ? 'navbar-menu-open' : ''}`}>
        {currentUser ? (
          <>
            <div className="navbar-links">
              <NavLink to="/dashboard" onClick={handleNavClick}>Dashboard</NavLink>
              <NavLink to="/sessions" onClick={handleNavClick}>Sessions</NavLink>
              <NavLink to="/assignments" onClick={handleNavClick}>Assignments</NavLink>
              <NavLink to="/pomodoro" onClick={handleNavClick}>Pomodoro</NavLink>
            </div>
            <div className="navbar-right">
              <span className="navbar-email">{currentUser.email}</span>
              <button className="navbar-logout" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-right">
            <Link to="/login" className="navbar-auth-link" onClick={handleNavClick}>Log In</Link>
            <Link to="/signup" className="navbar-auth-link navbar-signup" onClick={handleNavClick}>Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
