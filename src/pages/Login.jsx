import { useState } from 'react'
import { useNavigate, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/dashboard'

  if (currentUser) {
    return <Navigate to="/dashboard" />
  }

  function getFieldError(field) {
    if (!touched[field]) return null
    switch (field) {
      case 'email':
        if (!email) return 'Email is required.'
        if (!emailRegex.test(email)) return 'Please use correct format (example@email.com).'
        return null
      case 'password':
        if (!password) return 'Password is required.'
        return null
      default:
        return null
    }
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Incorrect email or password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address (example@email.com).'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return 'Failed to log in. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setErrorCode('')

    const allTouched = { email: true, password: true }
    setTouched(allTouched)

    if (!email || !emailRegex.test(email)) return
    if (!password) return

    setLoading(true)

    try {
      await login(email, password)
      navigate(redirectTo)
      return
    } catch (err) {
      setErrorCode(err.code)
      setError(getErrorMessage(err.code))
    }

    setLoading(false)
  }

  const emailError = getFieldError('email')
  const passwordError = getFieldError('password')

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-brand" aria-hidden="true">
          <p className="auth-brand-name">StudyStats</p>
          <p className="auth-brand-tagline">Plan sessions, track deadlines, study smarter.</p>
          <ul className="auth-brand-features">
            <li><span className="material-symbols-outlined">grid_view</span> Weekly progress dashboard</li>
            <li><span className="material-symbols-outlined">assignment</span> Assignment deadline tracker</li>
            <li><span className="material-symbols-outlined">menu_book</span> Study session logging</li>
            <li><span className="material-symbols-outlined">timer</span> Pomodoro timer</li>
          </ul>
        </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Log In</h2>
        {error && (
          <div className="auth-error" role="alert">
            <p>{error}</p>
            {errorCode === 'auth/invalid-credential' && (
              <p>
                Need an account? <Link to="/signup">Sign up here</Link>
              </p>
            )}
          </div>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            autoComplete="email"
            aria-describedby={emailError ? 'login-email-error' : undefined}
            aria-invalid={emailError ? true : undefined}
          />
        </label>
        {emailError && <p className="field-error" id="login-email-error">{emailError}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => handleBlur('password')}
            autoComplete="current-password"
            aria-describedby={passwordError ? 'login-password-error' : undefined}
            aria-invalid={passwordError ? true : undefined}
          />
        </label>
        {passwordError && <p className="field-error" id="login-password-error">{passwordError}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in\u2026' : 'Log In'}
        </button>
        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
      </div>
    </div>
  )
}
