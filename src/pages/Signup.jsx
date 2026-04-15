import { useState } from 'react'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

const passwordRules = [
  { test: (pw) => /[A-Z]/.test(pw), label: 'At least 1 uppercase letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'At least 1 lowercase letter' },
  { test: (pw) => /[0-9]/.test(pw), label: 'At least 1 number' },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: 'At least 1 special character (@, !, *, etc.)' },
  { test: (pw) => pw.length >= 8 && pw.length <= 100, label: '8–100 characters' },
]

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})
  const { signup, currentUser } = useAuth()
  const navigate = useNavigate()

  if (currentUser) {
    return <Navigate to="/dashboard" />
  }

  const allRulesPassed = passwordRules.every((rule) => rule.test(password))

  function getFieldError(field) {
    if (!touched[field]) return null
    switch (field) {
      case 'email':
        if (!email) return 'Email is required.'
        if (!emailRegex.test(email)) return 'Please use correct format (example@email.com).'
        return null
      case 'confirmPassword':
        if (!confirmPassword) return 'Please confirm your password.'
        if (confirmPassword !== password) return 'Passwords do not match.'
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
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/invalid-email':
        return 'Please use correct format (example@email.com).'
      case 'auth/weak-password':
        return 'Password does not meet the requirements.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return 'Failed to create account. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const allTouched = { email: true, password: true, confirmPassword: true }
    setTouched(allTouched)

    if (!email || !emailRegex.test(email)) return
    if (!allRulesPassed) return
    if (!confirmPassword || confirmPassword !== password) return

    setLoading(true)

    try {
      await signup(email, password)
      navigate('/dashboard')
      return
    } catch (err) {
      setError(getErrorMessage(err.code))
    }

    setLoading(false)
  }

  const emailError = getFieldError('email')
  const confirmError = getFieldError('confirmPassword')

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Sign Up</h2>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => handleBlur('email')}
            autoComplete="email"
            aria-describedby={emailError ? 'signup-email-error' : undefined}
            aria-invalid={emailError ? true : undefined}
          />
        </label>
        {emailError && <p className="field-error" id="signup-email-error">{emailError}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouched((prev) => ({ ...prev, password: true }))}
            autoComplete="new-password"
            aria-describedby={touched.password && !allRulesPassed ? 'signup-password-hint' : undefined}
          />
        </label>
        {touched.password && !allRulesPassed && (
          <p className="password-hint" id="signup-password-hint">
            {passwordRules.find((rule) => !rule.test(password)).label}
          </p>
        )}
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            autoComplete="new-password"
            aria-describedby={confirmError ? 'signup-confirm-error' : undefined}
            aria-invalid={confirmError ? true : undefined}
          />
        </label>
        {confirmError && <p className="field-error" id="signup-confirm-error">{confirmError}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
