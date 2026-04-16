import StudyVibeQuote from './StudyVibeQuote'
import StudyVibeMusic from './StudyVibeMusic'
import './StudyVibe.css'

export default function StudyVibe() {
  return (
    <div className="sv-card">
      <StudyVibeQuote inner />
      <hr className="sv-divider" aria-hidden="true" />
      <StudyVibeMusic inner />
    </div>
  )
}
