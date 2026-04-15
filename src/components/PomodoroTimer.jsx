import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { addSession, updateAssignment } from '../services/firestore'
import './PomodoroTimer.css'

// SVG ring constants
const RADIUS = 28
const CIRC = 2 * Math.PI * RADIUS

function formatTimer(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const p = (n) => String(n).padStart(2, '0')
  if (h >= 10) return `${p(h)}:${p(m)}:${p(s)}`
  if (h >= 1) return `${h}:${p(m)}:${p(s)}`
  return `${p(m)}:${p(s)}`
}

function notify(body) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission === 'granted') {
    try { new Notification('StudyStats', { body }) } catch {}
  }
}

const PomodoroTimer = forwardRef(function PomodoroTimer(
  { assignment, uid, onSessionLogged, activeTimerId, onTimerStart, onTimerStop,
    vertical = false, autoStart = false },
  ref
) {
  const isReady = !!(assignment?.title?.trim() && assignment?.subject?.trim())
  const isThisActive = activeTimerId === assignment?.id

  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [phase, setPhase] = useState('work')   // 'work' | 'break'
  const [status, setStatus] = useState('idle') // 'idle' | 'running' | 'paused'
  const [remainingMs, setRemainingMs] = useState(25 * 60 * 1000)
  const [toast, setToast] = useState(null)
  const [logError, setLogError] = useState(null)
  const [logging, setLogging] = useState(false)

  // Refs for timestamp-based calculation — avoids drift when the tab is backgrounded
  // (compares Date.now() to stored start time rather than blindly decrementing)
  const startedAtRef = useRef(null)       // Date.now() when current run started/resumed
  const accumulatedMsRef = useRef(0)      // ms elapsed before current run (from prior pauses)
  const totalMsRef = useRef(25 * 60 * 1000) // total ms for the current phase
  const intervalRef = useRef(null)
  const toastTimerRef = useRef(null)
  const phaseTransitionRef = useRef(null) // delayed break-phase transition after work complete

  // "Live" refs — updated every render so stable callbacks always read fresh values
  const phaseRef = useRef(phase)
  const workMinutesRef = useRef(workMinutes)
  const breakMinutesRef = useRef(breakMinutes)
  const assignmentRef = useRef(assignment)
  const uidRef = useRef(uid)
  const onSessionLoggedRef = useRef(onSessionLogged)
  const onTimerStartRef = useRef(onTimerStart)
  const onTimerStopRef = useRef(onTimerStop)

  phaseRef.current = phase
  workMinutesRef.current = workMinutes
  breakMinutesRef.current = breakMinutes
  assignmentRef.current = assignment
  uidRef.current = uid
  onSessionLoggedRef.current = onSessionLogged
  onTimerStartRef.current = onTimerStart
  onTimerStopRef.current = onTimerStop

  // ---- Imperative handle — lets Assignments.jsx call forceStop/forceStart ----
  // Used when the user confirms "stop & start" in the conflict prompt.
  // React setState calls are stable across renders so [] deps is safe here.
  useImperativeHandle(ref, () => ({
    forceStop() {
      clearInterval(intervalRef.current)
      clearTimeout(phaseTransitionRef.current)
      accumulatedMsRef.current = 0
      startedAtRef.current = null
      const ms = workMinutesRef.current * 60 * 1000
      totalMsRef.current = ms
      setPhase('work')
      setStatus('idle')
      setRemainingMs(ms)
      setLogError(null)
      onTimerStopRef.current?.()
    },
    forceStart() {
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission()
      }
      startedAtRef.current = Date.now()
      setStatus('running')
      onTimerStartRef.current?.(assignmentRef.current?.id)
    },
  }), [])

  // ---- Phase-complete handler — reads all values from refs, never stale ----
  const handlePhaseComplete = useCallback(() => {
    const ph = phaseRef.current
    const wm = workMinutesRef.current
    const bm = breakMinutesRef.current
    const a = assignmentRef.current
    const u = uidRef.current

    accumulatedMsRef.current = 0
    startedAtRef.current = null
    onTimerStopRef.current?.()

    if (ph === 'work') {
      // Auto-log a session linked to this assignment
      setLogging(true)
      setLogError(null)
      notify('Work session complete! Take a break.')

      // Set idle immediately so controls don't show a stale "running" state
      setStatus('idle')

      // Track which write succeeded so the catch can show the right message.
      // sessionSaved=false → addSession failed; sessionSaved=true → only updateAssignment failed.
      let sessionSaved = false
      addSession(u, {
        subject: a.subject,
        duration: wm,
        notes: '',
        date: new Date(),
        color: a.color || '#6366F1',
        status: 'complete',
        assignmentId: a.id,
      })
        .then(() => {
          // Session is saved — show toast now so it only appears on success
          sessionSaved = true
          setToast(`${wm}m logged!`)
          clearTimeout(toastTimerRef.current)
          toastTimerRef.current = setTimeout(() => setToast(null), 3000)
          return updateAssignment(u, a.id, {
            totalMinutesLogged: (a.totalMinutesLogged || 0) + wm,
          })
        })
        .then(() => { onSessionLoggedRef.current?.(); setLogging(false) })
        .catch(() => {
          setLogError(
            sessionSaved
              ? 'Study time total could not be updated. Check the Sessions page.'
              : 'Could not save session. Add it manually on the Sessions page.'
          )
          setLogging(false)
        })

      // Hold the completed work state (00:00, depleted ring) for 1.5s before switching to break
      const bMs = bm * 60 * 1000
      phaseTransitionRef.current = setTimeout(() => {
        totalMsRef.current = bMs
        setPhase('break')
        setRemainingMs(bMs)
      }, 1500)
    } else {
      // Break complete — return to work idle
      notify('Break over! Ready to focus?')
      const wMs = wm * 60 * 1000
      totalMsRef.current = wMs
      setPhase('work')
      setStatus('idle')
      setRemainingMs(wMs)
    }
  }, [])

  // ---- Ticker — timestamp-based remaining calculation ----
  useEffect(() => {
    if (status !== 'running') {
      clearInterval(intervalRef.current)
      return
    }
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current + accumulatedMsRef.current
      const remaining = Math.max(0, totalMsRef.current - elapsed)
      setRemainingMs(remaining)
      if (remaining === 0) {
        clearInterval(intervalRef.current)
        handlePhaseComplete()
      }
    }, 200)
    return () => clearInterval(intervalRef.current)
  }, [status, handlePhaseComplete])

  // ---- Warn before unloading while timer is running ----
  useEffect(() => {
    if (status !== 'running') return
    const warn = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status])

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(toastTimerRef.current)
      clearTimeout(phaseTransitionRef.current)
    }
  }, [])

  // ---- Sync display when inputs change while idle ----
  useEffect(() => {
    if (status === 'idle' && phase === 'work') {
      const ms = workMinutes * 60 * 1000
      totalMsRef.current = ms
      setRemainingMs(ms)
    }
  }, [workMinutes, status, phase])

  useEffect(() => {
    if (status === 'idle' && phase === 'break') {
      const ms = breakMinutes * 60 * 1000
      totalMsRef.current = ms
      setRemainingMs(ms)
    }
  }, [breakMinutes, status, phase])

  // ---- Auto-start on mount (used after "Stop & Start" conflict resolution) ----
  useEffect(() => {
    if (!autoStart || !isReady) return
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    startedAtRef.current = Date.now()
    setStatus('running')
    onTimerStart?.(assignment?.id)
  // Intentionally fires once per mount — deps excluded to avoid re-triggering mid-session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Event handlers ----
  function handleStart() {
    if (!isReady || logging) return
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    startedAtRef.current = Date.now()
    setStatus('running')
    onTimerStart?.(assignment.id)
  }

  function handlePause() {
    accumulatedMsRef.current += Date.now() - startedAtRef.current
    startedAtRef.current = null
    setStatus('paused')
    onTimerStop?.()
  }

  function handleResume() {
    startedAtRef.current = Date.now()
    setStatus('running')
    onTimerStart?.(assignment.id)
  }

  function handleReset() {
    clearInterval(intervalRef.current)
    clearTimeout(phaseTransitionRef.current)
    accumulatedMsRef.current = 0
    startedAtRef.current = null
    const ms = workMinutes * 60 * 1000
    totalMsRef.current = ms
    setPhase('work')
    setStatus('idle')
    setRemainingMs(ms)
    setLogError(null)
    if (isThisActive || status === 'paused') onTimerStop?.()
  }

  // ---- SVG ring ----
  const rawProgress = totalMsRef.current > 0
    ? Math.max(0, Math.min(1, 1 - remainingMs / totalMsRef.current))
    : 0
  const dashOffset = CIRC * rawProgress
  const ringColor = phase === 'work' ? '#6366F1' : '#22c55e'

  const timeStr = formatTimer(remainingMs)
  const timeClass = `pomodoro-ring-time${
    timeStr.length > 7 ? ' time-long-long' : timeStr.length > 5 ? ' time-long' : ''
  }`

  return (
    <div className={`pomodoro-timer${vertical ? ' pomodoro-vertical' : ''}`}>
      <div className="pomodoro-main">

        {/* SVG progress ring with centered time overlay */}
        <div className="pomodoro-ring-wrap">
          <svg viewBox="0 0 72 72" aria-hidden="true" style={{ transform: 'scaleX(-1)' }}>
            <circle cx="36" cy="36" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <circle
              cx="36" cy="36" r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="5"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.2s linear' }}
            />
          </svg>
          <div className={timeClass} aria-live="off">{timeStr}</div>
        </div>

        {/* Right column: config (idle only) + phase label + controls */}
        <div className="pomodoro-right">
          {status === 'idle' && (
            <div className="pomodoro-config">
              <label className="pomodoro-config-label">
                Work
                <input
                  type="number"
                  className="pomodoro-config-input"
                  value={workMinutes}
                  min={1}
                  max={1440}
                  onChange={(e) => {
                    const v = Math.min(1440, Math.max(1, parseInt(e.target.value, 10) || 1))
                    setWorkMinutes(v)
                  }}
                  aria-label="Work duration in minutes"
                />
                min
              </label>
              <label className="pomodoro-config-label">
                Break
                <input
                  type="number"
                  className="pomodoro-config-input"
                  value={breakMinutes}
                  min={1}
                  max={120}
                  onChange={(e) => {
                    const v = Math.min(120, Math.max(1, parseInt(e.target.value, 10) || 1))
                    setBreakMinutes(v)
                  }}
                  aria-label="Break duration in minutes"
                />
                min
              </label>
            </div>
          )}

          {(status === 'running' || status === 'paused') && (
            <div className={`pomodoro-phase-label${phase === 'break' ? ' break' : ''}`}>
              {phase === 'work' ? 'Work' : 'Break'}
              {status === 'paused' && ' \u2014 Paused'}
            </div>
          )}

          {status === 'idle' && phase === 'break' && (
            <div className="pomodoro-phase-label break">Break ready</div>
          )}

          <div className="pomodoro-controls">
            {status === 'running' ? (
              <button
                className="pomodoro-btn pomodoro-btn-pause"
                onClick={handlePause}
                aria-label="Pause timer"
              >
                <span className="material-symbols-outlined" aria-hidden="true">pause</span>
              </button>
            ) : status === 'paused' ? (
              <button
                className="pomodoro-btn pomodoro-btn-play"
                onClick={handleResume}
                aria-label="Resume timer"
              >
                <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>
              </button>
            ) : (
              <button
                className="pomodoro-btn pomodoro-btn-play"
                onClick={handleStart}
                disabled={!isReady || logging}
                aria-label={phase === 'work' ? 'Start work timer' : 'Start break timer'}
                title={!isReady ? 'Fill in title and subject to start timer' : undefined}
              >
                <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>
              </button>
            )}

            <button
              className="pomodoro-btn pomodoro-btn-reset"
              onClick={handleReset}
              disabled={status === 'idle' && phase === 'work'}
              aria-label="Reset timer"
              title="Reset"
            >
              <span className="material-symbols-outlined" aria-hidden="true">restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline status messages */}
      {!isReady && status === 'idle' && (
        <p className="pomodoro-msg pomodoro-warning">
          Fill in title and subject to start timer.
        </p>
      )}
      {logging && (
        <p className="pomodoro-msg pomodoro-logging">Logging session&hellip;</p>
      )}
      {logError && (
        <p className="pomodoro-msg pomodoro-error" role="alert">{logError}</p>
      )}
      {toast && (
        <div className="pomodoro-toast" role="status" aria-live="polite">
          <span className="material-symbols-outlined pomodoro-toast-icon" aria-hidden="true">
            check_circle
          </span>
          {toast}
        </div>
      )}
    </div>
  )
})

export default PomodoroTimer
