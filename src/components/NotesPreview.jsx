import { useState, useRef, useEffect } from 'react'

export default function NotesPreview({ text, wrapperClassName = 'notes-preview-wrapper', textClassName = 'notes-preview' }) {
  const [expanded, setExpanded] = useState(false)
  const textRef = useRef(null)
  const [clamped, setClamped] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div className={wrapperClassName}>
      <p
        ref={expanded ? null : textRef}
        className={`${textClassName}${expanded ? '' : ' clamped'}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          type="button"
          className="btn-show-more"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}
