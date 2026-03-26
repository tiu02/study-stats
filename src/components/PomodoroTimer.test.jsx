import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PomodoroTimer from './PomodoroTimer'
import { addSession, updateAssignment } from '../services/firestore'

vi.mock('./PomodoroTimer.css', () => ({}))
vi.mock('../services/firestore', () => ({
  addSession: vi.fn(),
  updateAssignment: vi.fn(),
}))

// Stub Notification — 'denied' permission skips requestPermission and notification logic
vi.stubGlobal('Notification', Object.assign(vi.fn(), {
  permission: 'denied',
  requestPermission: vi.fn().mockResolvedValue('denied'),
}))

// ---- Fixtures ----

const READY = {
  id: 'a1',
  title: 'Chapter 5 HW',
  subject: 'Math',
  color: '#6366F1',
  totalMinutesLogged: 10,
}

const INCOMPLETE = {
  id: 'a2',
  title: '',
  subject: '',
  color: '#6366F1',
  totalMinutesLogged: 0,
}

function makeProps(overrides = {}) {
  return {
    assignment: READY,
    uid: 'user-1',
    onSessionLogged: vi.fn(),
    activeTimerId: null,
    onTimerStart: vi.fn(),
    onTimerStop: vi.fn(),
    ...overrides,
  }
}

/**
 * Advance fake timers past a work phase (default 25 min) and flush the
 * two-level async Firestore chain: addSession → .then → updateAssignment → .then.
 */
async function completeWorkPhase(workMs = 25 * 60 * 1000) {
  await act(async () => {
    vi.advanceTimersByTime(workMs + 200)
  })
  // Flush promise microtasks: tick 1 → addSession resolves / rejects,
  // tick 2 → second .then / .catch resolves / rejects
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

// ---- Suite ----

describe('PomodoroTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    addSession.mockResolvedValue(undefined)
    updateAssignment.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---- Default state ----

  describe('default state', () => {
    it('shows 25:00 countdown', () => {
      render(<PomodoroTimer {...makeProps()} />)
      expect(screen.getByText('25:00')).toBeInTheDocument()
    })

    it('start button is enabled', () => {
      render(<PomodoroTimer {...makeProps()} />)
      expect(screen.getByRole('button', { name: 'Start work timer' })).not.toBeDisabled()
    })

    it('reset button is disabled', () => {
      render(<PomodoroTimer {...makeProps()} />)
      expect(screen.getByRole('button', { name: 'Reset timer' })).toBeDisabled()
    })

    it('shows work and break duration config inputs with defaults', () => {
      render(<PomodoroTimer {...makeProps()} />)
      expect(screen.getByLabelText('Work duration in minutes')).toHaveValue(25)
      expect(screen.getByLabelText('Break duration in minutes')).toHaveValue(5)
    })
  })

  // ---- Disabled state ----

  describe('disabled state (assignment not ready)', () => {
    it('start button is disabled', () => {
      render(<PomodoroTimer {...makeProps({ assignment: INCOMPLETE })} />)
      expect(screen.getByRole('button', { name: 'Start work timer' })).toBeDisabled()
    })

    it('shows fill-in warning message', () => {
      render(<PomodoroTimer {...makeProps({ assignment: INCOMPLETE })} />)
      expect(
        screen.getByText('Fill in title and subject to start timer.')
      ).toBeInTheDocument()
    })
  })

  // ---- Start ----

  describe('start', () => {
    it('hides config inputs and shows Work phase label', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      expect(screen.queryByLabelText('Work duration in minutes')).not.toBeInTheDocument()
      expect(screen.getByText('Work')).toBeInTheDocument()
    })

    it('calls onTimerStart with assignment id', () => {
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      expect(props.onTimerStart).toHaveBeenCalledWith('a1')
    })
  })

  // ---- Pause ----

  describe('pause', () => {
    it('shows paused label', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      expect(screen.getByText(/Work.*Paused/)).toBeInTheDocument()
    })

    it('shows resume button', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      expect(screen.getByRole('button', { name: 'Resume timer' })).toBeInTheDocument()
    })

    it('calls onTimerStop', () => {
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      expect(props.onTimerStop).toHaveBeenCalledTimes(1)
    })
  })

  // ---- Resume ----

  describe('resume', () => {
    it('shows pause button and Work label again', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Resume timer' }))
      expect(screen.getByRole('button', { name: 'Pause timer' })).toBeInTheDocument()
      expect(screen.getByText('Work')).toBeInTheDocument()
    })

    it('calls onTimerStart again with assignment id on resume', () => {
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Resume timer' }))
      expect(props.onTimerStart).toHaveBeenCalledTimes(2)
      expect(props.onTimerStart).toHaveBeenLastCalledWith('a1')
    })
  })

  // ---- Reset ----

  describe('reset', () => {
    it('returns to 25:00 and re-shows config inputs after reset from running', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }))
      expect(screen.getByText('25:00')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start work timer' })).toBeInTheDocument()
      expect(screen.getByLabelText('Work duration in minutes')).toBeInTheDocument()
      // Reset button should be disabled again in idle/work state
      expect(screen.getByRole('button', { name: 'Reset timer' })).toBeDisabled()
    })

    it('calls onTimerStop when reset from paused state', () => {
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
      vi.clearAllMocks() // clear the pause-triggered onTimerStop call
      fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }))
      expect(props.onTimerStop).toHaveBeenCalledTimes(1)
    })
  })

  // ---- Work phase completes ----

  describe('work phase completion', () => {
    it('calls addSession with correct fields', async () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(addSession).toHaveBeenCalledWith('user-1', {
        subject: 'Math',
        duration: 25,
        notes: '',
        date: expect.any(Date),
        color: '#6366F1',
        status: 'complete',
        assignmentId: 'a1',
      })
    })

    it('calls updateAssignment with incremented totalMinutesLogged', async () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(updateAssignment).toHaveBeenCalledWith('user-1', 'a1', {
        totalMinutesLogged: 35, // READY.totalMinutesLogged (10) + workMinutes (25)
      })
    })

    it('shows success toast after session is saved', async () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(screen.getByText('25m logged!')).toBeInTheDocument()
    })

    it('transitions to break idle 1500ms after work completes', async () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      // Phase transition not yet fired
      expect(screen.queryByText('Break ready')).not.toBeInTheDocument()

      await act(async () => { vi.advanceTimersByTime(1500) })

      expect(screen.getByText('Break ready')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start break timer' })).toBeInTheDocument()
    })
  })

  // ---- Custom durations ----

  describe('custom durations', () => {
    it('updates displayed time when work input changes while idle', () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.change(
        screen.getByLabelText('Work duration in minutes'),
        { target: { value: '10' } }
      )
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    it('logs the custom work duration when phase completes', async () => {
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.change(
        screen.getByLabelText('Work duration in minutes'),
        { target: { value: '10' } }
      )
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase(10 * 60 * 1000)

      expect(addSession).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ duration: 10 })
      )
    })
  })

  // ---- Firestore write failure ----

  describe('Firestore write failure', () => {
    it('shows addSession error and does not show toast', async () => {
      addSession.mockRejectedValue(new Error('network error'))
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not save session. Add it manually on the Sessions page.'
      )
      expect(screen.queryByText('25m logged!')).not.toBeInTheDocument()
    })

    it('shows updateAssignment error when session saves but count update fails', async () => {
      addSession.mockResolvedValue(undefined)
      updateAssignment.mockRejectedValue(new Error('update failed'))
      render(<PomodoroTimer {...makeProps()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Study time total could not be updated. Check the Sessions page.'
      )
    })
  })

  // ---- onSessionLogged callback ----

  describe('onSessionLogged callback', () => {
    it('fires after both writes succeed', async () => {
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(props.onSessionLogged).toHaveBeenCalledTimes(1)
    })

    it('does not fire when addSession fails', async () => {
      addSession.mockRejectedValue(new Error('fail'))
      const props = makeProps()
      render(<PomodoroTimer {...props} />)
      fireEvent.click(screen.getByRole('button', { name: 'Start work timer' }))
      await completeWorkPhase()

      expect(props.onSessionLogged).not.toHaveBeenCalled()
    })
  })
})
