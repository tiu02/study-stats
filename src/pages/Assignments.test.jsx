import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Assignments from './Assignments'
import { useAuth } from '../context/AuthContext'
import { useAssignments } from '../hooks/useFirestore'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useFirestore', () => ({ useAssignments: vi.fn() }))

// Mock AssignmentForm to a simple stub
vi.mock('../components/AssignmentForm', () => ({
  default: function MockAssignmentForm({ onSubmit, onCancel, initialData }) {
    return (
      <div data-testid="assignment-form">
        <span data-testid="form-initial-title">{initialData?.title || ''}</span>
        <button
          onClick={() => onSubmit({ subject: 'Biology', title: 'New Homework', dueDate: new Date('2026-06-01'), color: '#6366F1', notes: '' })}
        >
          Submit Form
        </button>
        {onCancel && <button onClick={onCancel}>Cancel Form</button>}
      </div>
    )
  },
}))

// Mock PomodoroTimer (uses forwardRef)
vi.mock('../components/PomodoroTimer', async () => {
  const { forwardRef } = await import('react')
  return {
    default: forwardRef(function MockTimer({ assignment, onTimerStart }, ref) {
      return (
        <div data-testid="mock-timer">
          <button onClick={() => onTimerStart?.(assignment?.id)}>Start Timer</button>
        </div>
      )
    }),
  }
})

const mockAdd = vi.fn()
const mockUpdate = vi.fn()
const mockRemove = vi.fn()
const mockRefresh = vi.fn()

const baseAssignment = {
  id: 'a1',
  subject: 'Math',
  title: 'Calculus HW',
  dueDate: new Date('2026-12-31'),
  color: '#6366F1',
  completed: false,
  notes: '',
  totalMinutesLogged: 0,
}

const completedAssignment = {
  id: 'a2',
  subject: 'English',
  title: 'Essay Draft',
  dueDate: new Date('2026-12-31'),
  color: '#2563EB',
  completed: true,
  notes: '',
  totalMinutesLogged: 0,
}

function setupMocks(assignments = [baseAssignment]) {
  useAuth.mockReturnValue({ currentUser: { uid: 'u1' } })
  useAssignments.mockReturnValue({
    assignments,
    loading: false,
    error: null,
    add: mockAdd,
    update: mockUpdate,
    remove: mockRemove,
    refresh: mockRefresh,
  })
}

function renderAssignments() {
  return render(
    <MemoryRouter>
      <Assignments />
    </MemoryRouter>
  )
}

describe('Assignments — loading & empty states', () => {
  it('shows loading spinner while loading', () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'u1' } })
    useAssignments.mockReturnValue({ assignments: [], loading: true, error: null, add: mockAdd, update: mockUpdate, remove: mockRemove, refresh: mockRefresh })
    renderAssignments()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/loading assignments/i)).toBeInTheDocument()
  })

  it('shows empty state when no assignments', () => {
    setupMocks([])
    renderAssignments()
    expect(screen.getByText(/no assignments yet/i)).toBeInTheDocument()
  })

  it('shows error banner when error is set', () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'u1' } })
    useAssignments.mockReturnValue({ assignments: [], loading: false, error: 'Load failed', add: mockAdd, update: mockUpdate, remove: mockRemove, refresh: mockRefresh })
    renderAssignments()
    expect(screen.getByRole('alert')).toHaveTextContent('Load failed')
  })
})

describe('Assignments — card rendering', () => {
  beforeEach(() => setupMocks())

  it('renders assignment card with title', () => {
    renderAssignments()
    expect(screen.getByText('Calculus HW')).toBeInTheDocument()
  })

  it('renders the subject badge', () => {
    renderAssignments()
    expect(screen.getByText('Math')).toBeInTheDocument()
  })

  it('renders edit, duplicate, delete buttons', () => {
    renderAssignments()
    expect(screen.getByRole('button', { name: /edit calculus hw/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /duplicate calculus hw/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete calculus hw/i })).toBeInTheDocument()
  })

  it('renders timer button for active assignment', () => {
    renderAssignments()
    expect(screen.getByRole('button', { name: /open timer for calculus hw/i })).toBeInTheDocument()
  })
})

describe('Assignments — add modal', () => {
  beforeEach(() => {
    setupMocks()
    mockAdd.mockClear()
  })

  it('opens add modal when Add Assignment is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    expect(screen.getByTestId('assignment-form')).toBeInTheDocument()
  })

  it('calls add and closes modal on form submit', async () => {
    const user = userEvent.setup()
    mockAdd.mockResolvedValue({ ok: true })
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    await user.click(screen.getByRole('button', { name: /submit form/i }))
    await waitFor(() => expect(mockAdd).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByTestId('assignment-form')).not.toBeInTheDocument())
  })

  it('keeps modal open on add failure', async () => {
    const user = userEvent.setup()
    mockAdd.mockResolvedValue({ ok: false, error: 'Write failed' })
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    await user.click(screen.getByRole('button', { name: /submit form/i }))
    await waitFor(() => expect(mockAdd).toHaveBeenCalled())
    expect(screen.getByTestId('assignment-form')).toBeInTheDocument()
  })
})

describe('Assignments — edit modal', () => {
  beforeEach(() => {
    setupMocks()
    mockUpdate.mockClear()
  })

  it('opens edit modal with pre-filled data when Edit is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /edit calculus hw/i }))
    expect(screen.getByTestId('assignment-form')).toBeInTheDocument()
    expect(screen.getByTestId('form-initial-title')).toHaveTextContent('Calculus HW')
  })

  it('calls update and closes modal on form submit', async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ok: true })
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /edit calculus hw/i }))
    await user.click(screen.getByRole('button', { name: /submit form/i }))
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('a1', expect.any(Object)))
    await waitFor(() => expect(screen.queryByTestId('assignment-form')).not.toBeInTheDocument())
  })
})

describe('Assignments — delete modal', () => {
  beforeEach(() => {
    setupMocks()
    mockRemove.mockClear()
  })

  it('opens delete confirmation modal when Delete is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /delete calculus hw/i }))
    expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument()
  })

  it('calls remove and closes modal on confirm', async () => {
    const user = userEvent.setup()
    mockRemove.mockResolvedValue({ ok: true })
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /delete calculus hw/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockRemove).toHaveBeenCalledWith('a1'))
    await waitFor(() => expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument())
  })

  it('shows delete error when remove fails', async () => {
    const user = userEvent.setup()
    mockRemove.mockResolvedValue({ ok: false, error: 'Permission denied' })
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /delete calculus hw/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.getByText(/permission denied/i)).toBeInTheDocument())
  })

  it('cancels delete when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /delete calculus hw/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/this action cannot be undone/i)).not.toBeInTheDocument()
    expect(mockRemove).not.toHaveBeenCalled()
  })
})

describe('Assignments — toggle complete', () => {
  beforeEach(() => {
    setupMocks()
    mockUpdate.mockClear()
  })

  it('calls update with completed: true when checkbox is clicked', async () => {
    const user = userEvent.setup()
    mockUpdate.mockResolvedValue({ ok: true })
    renderAssignments()
    await user.click(screen.getByRole('checkbox', { name: /mark "calculus hw" as complete/i }))
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith('a1', { completed: true })
    )
  })
})

describe('Assignments — duplicate as template', () => {
  beforeEach(() => setupMocks())

  it('opens add modal with pre-filled subject when Duplicate is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /duplicate calculus hw/i }))
    expect(screen.getByTestId('assignment-form')).toBeInTheDocument()
  })
})

describe('Assignments — completed section', () => {
  beforeEach(() => setupMocks([baseAssignment, completedAssignment]))

  it('renders completed section toggle with count', () => {
    renderAssignments()
    expect(screen.getByRole('button', { name: /completed \(1\)/i })).toBeInTheDocument()
  })

  it('expands completed section when toggle is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /completed \(1\)/i }))
    expect(screen.getByText('Essay Draft')).toBeInTheDocument()
  })

  it('collapses completed section on second click', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /completed \(1\)/i }))
    await user.click(screen.getByRole('button', { name: /completed \(1\)/i }))
    expect(screen.queryByText('Essay Draft')).not.toBeInTheDocument()
  })

  it('shows all caught up message when all assignments are completed', () => {
    setupMocks([completedAssignment])
    renderAssignments()
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })
})

describe('Assignments — timer modal', () => {
  beforeEach(() => setupMocks())

  it('opens timer modal when Timer button is clicked', async () => {
    const user = userEvent.setup()
    renderAssignments()
    await user.click(screen.getByRole('button', { name: /open timer for calculus hw/i }))
    expect(screen.getByTestId('mock-timer')).toBeInTheDocument()
  })

  it('shows timer conflict modal when a second timer is started', async () => {
    const user = userEvent.setup()
    const second = { ...baseAssignment, id: 'a3', title: 'Physics Lab', completed: false }
    setupMocks([baseAssignment, second])
    renderAssignments()

    // Open first timer and "start" it via mock
    await user.click(screen.getByRole('button', { name: /open timer for calculus hw/i }))
    await user.click(screen.getByRole('button', { name: /start timer/i }))

    // Close the timer modal to attempt opening the second
    // (conflict is triggered by clicking a second timer button while one is active)
    // Close modal via Escape
    await user.keyboard('{Escape}')

    // Reopen the assignments page — activeTimerId is set from first Start Timer click
    // Now click the second timer button
    await user.click(screen.getByRole('button', { name: /open timer for physics lab/i }))
    expect(screen.getByText(/timer already running/i)).toBeInTheDocument()
  })
})
