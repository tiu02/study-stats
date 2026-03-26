import { useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { DashboardIcon, SessionsIcon, AssignmentsIcon, ProfileIcon } from './Icons'
import './Navbar.css'

const protectedPaths = ['/dashboard', '/sessions', '/assignments']

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    try {
      await logout()
      if (!protectedPaths.includes(location.pathname)) {
        navigate('/')
      }
    } catch {
      alert('Logout failed. Please check your connection and try again.')
    }
  }

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <nav className={`navbar ${!currentUser ? 'navbar-logged-out' : ''}`} aria-label="Main navigation">
      <div className="navbar-top">
        <Link to="/" className="navbar-logo" onClick={handleNavClick}>StudyStats</Link>

        {currentUser && (
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
        )}
      </div>

      <div className={`navbar-menu ${menuOpen ? 'navbar-menu-open' : ''}`}>
        {currentUser ? (
          <>
            <div className="navbar-links">
              <NavLink to="/dashboard" onClick={handleNavClick}><DashboardIcon /> Dashboard</NavLink>
              <NavLink to="/sessions" onClick={handleNavClick}><SessionsIcon /> Sessions</NavLink>
              <NavLink to="/assignments" onClick={handleNavClick}><AssignmentsIcon /> Assignments</NavLink>
            </div>
            <div className="navbar-right">
              <button className="navbar-logout" onClick={handleLogout}>
                Log Out
              </button>
              <span className="navbar-profile" title={currentUser.email} aria-label={currentUser.email}>
                <ProfileIcon />
              </span>
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
