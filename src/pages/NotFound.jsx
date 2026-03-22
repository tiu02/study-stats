import { useNavigate } from 'react-router-dom'
import './NotFound.css'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <span className="not-found-icon" aria-hidden="true">&#9888;</span>
        <h1 className="not-found-heading">404</h1>
        <p className="not-found-message">The page you're looking for doesn't exist.</p>
        <button className="not-found-button" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  )
}
