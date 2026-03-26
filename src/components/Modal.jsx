import { useEffect, useRef } from 'react'
import './Modal.css'

export default function Modal({ open, onClose, ariaLabel, ariaDescribedBy, role, className, children }) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!open) return

    // Focus trap: focus the modal content on open
    const el = contentRef.current
    if (el) el.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // Trap focus within modal
      if (e.key === 'Tab' && el) {
        const focusable = el.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div className={`modal-overlay${className ? ` ${className}` : ''}`} ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className="modal-content"
        ref={contentRef}
        role={role || 'dialog'}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-modal="true"
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  )
}
