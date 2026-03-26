import { useEffect, useRef, useState } from 'react'
import './CustomSelect.css'

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  isActive = false,
  ...rest
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div className="cs-wrap" ref={wrapRef}>
      <button
        {...rest}
        type="button"
        id={id}
        className={`cs-trigger${isActive ? ' cs-trigger-active' : ''}${open ? ' cs-trigger-open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="cs-label">{selected ? selected.label : options[0]?.label}</span>
        <span className="material-symbols-outlined cs-chevron" aria-hidden="true">expand_more</span>
      </button>

      {open && (
        <div className="cs-dropdown" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={value === opt.value}
              className={`cs-option${value === opt.value ? ' cs-option-active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
