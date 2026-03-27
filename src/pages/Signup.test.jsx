import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Signup from './Signup'
import { useAuth } from '../context/AuthContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, Navigate: ({ to }) => <div data-testid="navigate" data-to={to} /> }
})

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

const mockSignup = vi.fn()

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>
  )
}

describe('Signup', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockSignup.mockClear()
    useAuth.mockReturnValue({ signup: mockSignup, currentUser: null })
  })

  it('renders the sign up form', () => {
    renderSignup()
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('redirects to / when already logged in', () => {
    useAuth.mockReturnValue({ signup: mockSignup, currentUser: { uid: 'u1' } })
    renderSignup()
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/')
  })

  it('shows password hint when password field is focused and rules not met', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.click(screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'a')
    expect(screen.getByText(/at least 1 uppercase/i)).toBeInTheDocument()
  })

  it('shows email format error on blur with invalid email', async () => {
    const user = userEvent.setup()
    renderSignup()
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'notanemail')
    await user.tab()
    expect(screen.getByText(/correct format/i)).toBeInTheDocument()
  })

  it('shows passwords do not match error', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByLabelText(/^password$/i), 'Abcdef1!')
    const confirmInput = screen.getByLabelText(/confirm password/i)
    await user.type(confirmInput, 'Different1!')
    await user.tab()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('calls signup and navigates on valid submission', async () => {
    const user = userEvent.setup()
    mockSignup.mockResolvedValue()
    renderSignup()
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'Abcdef1!'))
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('shows error message when signup throws', async () => {
    const user = userEvent.setup()
    mockSignup.mockRejectedValue({ code: 'auth/email-already-in-use' })
    renderSignup()
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/already exists/i))
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()
    let resolve
    mockSignup.mockReturnValue(new Promise((res) => { resolve = res }))
    renderSignup()
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Abcdef1!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Abcdef1!')
    await user.click(screen.getByRole('button', { name: /sign up/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled())
    resolve()
  })

  it('shows a link to login page', () => {
    renderSignup()
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })
})
