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

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const { signup, currentUser } = useAuth()
  const navigate = useNavigate()

  if (currentUser) {
    return <Navigate to="/" />
  }

  const allRulesPassed = passwordRules.every((rule) => rule.test(password))

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password does not meet the requirements below.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        return 'Failed to create account. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!allRulesPassed) {
      return setError('Password does not meet the requirements below.')
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)

    try {
      await signup(email, password)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err.code))
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        {error && <p className="auth-error">{error}</p>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPasswordTouched(true)}
            autoComplete="new-password"
            required
          />
        </label>
        {passwordTouched && !allRulesPassed && (
          <p className="password-hint">
            {passwordRules.find((rule) => !rule.test(password)).label}
          </p>
        )}
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
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
