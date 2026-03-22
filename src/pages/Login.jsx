import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function getErrorMessage(code) {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Incorrect email or password.'
      case 'auth/user-not-found':
        return 'No account found with this email.'
      case 'auth/wrong-password':
        return 'Incorrect password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      default:
        return 'Failed to log in. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err.code))
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Log In</h2>
        {error && <p className="auth-error">{error}</p>}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  )
}
