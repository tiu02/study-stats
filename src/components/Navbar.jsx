import { useState, useRef, useEffect } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const protectedPaths = ['/dashboard', '/sessions', '/assignments']

export default function Navbar() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    if (!profileOpen) return
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileOpen])

  async function handleLogout() {
    setMenuOpen(false)
    setProfileOpen(false)
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
              <NavLink to="/dashboard" onClick={handleNavClick}>
                <span className="material-symbols-outlined nav-link-icon" aria-hidden="true">grid_view</span>
                Dashboard
              </NavLink>
              <NavLink to="/assignments" onClick={handleNavClick}>
                <span className="material-symbols-outlined nav-link-icon" aria-hidden="true">assignment</span>
                Assignments
              </NavLink>
              <NavLink to="/sessions" onClick={handleNavClick}>
                <span className="material-symbols-outlined nav-link-icon" aria-hidden="true">menu_book</span>
                Sessions
              </NavLink>
            </div>
            <div className="navbar-right">
              <button className="navbar-logout" onClick={handleLogout}>
                Log Out
              </button>
              <div className="navbar-profile-wrap" ref={profileRef}>
                <button
                  className="navbar-profile"
                  onClick={() => setProfileOpen(o => !o)}
                  aria-label="Account"
                  aria-expanded={profileOpen}
                >
                  <span className="material-symbols-outlined" aria-hidden="true">person</span>
                </button>
                {profileOpen && (
                  <div className="navbar-profile-dropdown" role="status" aria-label="Signed in as">
                    <span className="profile-dropdown-name">{currentUser.displayName || currentUser.email}</span>
                  </div>
                )}
              </div>
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
