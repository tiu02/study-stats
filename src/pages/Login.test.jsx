import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    currentUser: null,
    loading: false,
  })),
}))

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { useAuth } from '../context/AuthContext'

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      login: mockLogin,
      currentUser: null,
      loading: false,
    })
  })

  it('renders the email input', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('renders the password input', () => {
    renderLogin()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('does not show an error message on initial render', () => {
    renderLogin()
    expect(screen.queryByText(/incorrect/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/required/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
  })

  it('shows user-not-found error with signup link for unregistered email', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({ code: 'auth/user-not-found' })

    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SomePass1!')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText('No account found with this email.')).toBeInTheDocument()
      expect(screen.getByText(/sign up here/i)).toBeInTheDocument()
    })

    expect(mockLogin).toHaveBeenCalledWith('new@example.com', 'SomePass1!')
  })
})
