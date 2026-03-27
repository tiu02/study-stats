import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import AssignmentForm from './AssignmentForm'

// Mock DatePicker — renders a button that triggers onChange with a fixed date
vi.mock('./DatePicker', () => ({
  default: function MockDatePicker({ onChange }) {
    return (
      <button type="button" onClick={() => onChange(new Date('2026-06-01T00:00:00'))}>
        Pick Date
      </button>
    )
  },
}))

const defaultProps = {
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  initialData: null,
  classMap: {},
  formError: null,
}

function renderForm(props = {}) {
  return render(<AssignmentForm {...defaultProps} {...props} />)
}

describe('AssignmentForm — add mode', () => {
  beforeEach(() => {
    defaultProps.onSubmit.mockReset()
    defaultProps.onCancel.mockReset()
  })

  it('renders Add Assignment heading', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /add assignment/i })).toBeInTheDocument()
  })

  it('renders subject, title, and notes fields', () => {
    renderForm()
    expect(screen.getByLabelText(/class \/ subject/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/assignment title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
  })

  it('calls onSubmit with form data on valid submission', async () => {
    const user = userEvent.setup()
    defaultProps.onSubmit.mockResolvedValue()
    renderForm()
    await user.type(screen.getByLabelText(/class \/ subject/i), 'Biology')
    await user.type(screen.getByLabelText(/assignment title/i), 'Chapter 5 Homework')
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    await waitFor(() =>
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'Biology', title: 'Chapter 5 Homework' })
      )
    )
  })

  it('shows validation error when subject is empty', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/assignment title/i), 'Some title')
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    expect(await screen.findByText(/class\/subject is required/i)).toBeInTheDocument()
  })

  it('shows validation error when title is empty', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/class \/ subject/i), 'Math')
    await user.click(screen.getByRole('button', { name: /add assignment/i }))
    expect(await screen.findByText(/assignment title is required/i)).toBeInTheDocument()
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('shows formError prop as alert', () => {
    renderForm({ formError: 'Server error' })
    expect(screen.getByRole('alert', { name: undefined })).toHaveTextContent('Server error')
  })

  it('shows subject clear button when subject has value', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/class \/ subject/i), 'History')
    expect(screen.getByRole('button', { name: /clear subject/i })).toBeInTheDocument()
  })

  it('clears subject when clear button is clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText(/class \/ subject/i), 'History')
    await user.click(screen.getByRole('button', { name: /clear subject/i }))
    expect(screen.getByLabelText(/class \/ subject/i)).toHaveValue('')
  })

  it('auto-selects color from classMap when known subject is typed', async () => {
    const user = userEvent.setup()
    renderForm({ classMap: { Biology: '#2563EB' } })
    const subjectInput = screen.getByLabelText(/class \/ subject/i)
    await user.type(subjectInput, 'Biology')
    // The Indigo swatch should NOT be selected (aria-pressed=false) and Cobalt should be (aria-pressed=true)
    expect(screen.getByRole('button', { name: /cobalt/i })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('AssignmentForm — edit mode', () => {
  const initialData = {
    id: 'a1',
    subject: 'Chemistry',
    title: 'Lab Report',
    dueDate: '2026-05-15',
    color: '#A855F7',
    notes: 'Bring goggles',
  }

  beforeEach(() => {
    defaultProps.onSubmit.mockReset()
    defaultProps.onCancel.mockReset()
  })

  it('renders Edit Assignment heading', () => {
    renderForm({ initialData })
    expect(screen.getByRole('heading', { name: /edit assignment/i })).toBeInTheDocument()
  })

  it('pre-fills subject and title', () => {
    renderForm({ initialData })
    expect(screen.getByLabelText(/class \/ subject/i)).toHaveValue('Chemistry')
    expect(screen.getByLabelText(/assignment title/i)).toHaveValue('Lab Report')
  })

  it('pre-fills notes', () => {
    renderForm({ initialData })
    expect(screen.getByRole('textbox', { name: /notes/i })).toHaveValue('Bring goggles')
  })

  it('shows Save Changes button', () => {
    renderForm({ initialData })
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
