import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Navbar from './Navbar'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
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

function renderNavbar(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('logged-out state', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({ currentUser: null, logout: mockLogout })
      renderNavbar()
    })

    it('shows the Log In link', () => {
      expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
    })

    it('shows the Sign Up link', () => {
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    })

    it('does not show Dashboard, Sessions, Assignments, or Pomodoro links', () => {
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /sessions/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /assignments/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /pomodoro/i })).not.toBeInTheDocument()
    })

    it('does not show the Logout button', () => {
      expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument()
    })

    it('does not show the hamburger menu button', () => {
      expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument()
    })
  })

  describe('logged-in state', () => {
    const mockUser = { uid: '123', email: 'student@example.com' }

    beforeEach(() => {
      useAuth.mockReturnValue({ currentUser: mockUser, logout: mockLogout })
      renderNavbar()
    })

    it('shows Dashboard, Sessions, Assignments, and Pomodoro links', () => {
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /sessions/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /assignments/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /pomodoro/i })).toBeInTheDocument()
    })

    it('shows the Logout button', () => {
      expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    })

    it('displays the profile icon with the user email', () => {
      expect(screen.getByLabelText('student@example.com')).toBeInTheDocument()
    })

    it('does not show Log In or Sign Up links', () => {
      expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument()
    })
  })

  describe('logo link', () => {
    it('shows the StudyStats logo when logged out', () => {
      useAuth.mockReturnValue({ currentUser: null, logout: mockLogout })
      renderNavbar()
      expect(screen.getByRole('link', { name: /studystats/i })).toBeInTheDocument()
    })

    it('shows the StudyStats logo when logged in', () => {
      useAuth.mockReturnValue({ currentUser: { uid: '1', email: 'a@b.com' }, logout: mockLogout })
      renderNavbar()
      expect(screen.getByRole('link', { name: /studystats/i })).toBeInTheDocument()
    })
  })

  describe('hamburger menu', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        currentUser: { uid: '1', email: 'a@b.com' },
        logout: mockLogout,
      })
    })

    it('toggles aria-expanded when clicked', async () => {
      const user = userEvent.setup()
      renderNavbar()

      const toggle = screen.getByRole('button', { name: /open menu/i })
      expect(toggle).toHaveAttribute('aria-expanded', 'false')

      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(toggle).toHaveAccessibleName(/close menu/i)

      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(toggle).toHaveAccessibleName(/open menu/i)
    })
  })

  describe('logout', () => {
    it('calls logout when Log Out button is clicked', async () => {
      const user = userEvent.setup()
      mockLogout.mockResolvedValue()
      useAuth.mockReturnValue({
        currentUser: { uid: '1', email: 'a@b.com' },
        logout: mockLogout,
      })
      renderNavbar()

      await user.click(screen.getByRole('button', { name: /log out/i }))
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })

    it('navigates to / after logout on a non-protected path', async () => {
      const user = userEvent.setup()
      mockLogout.mockResolvedValue()
      useAuth.mockReturnValue({
        currentUser: { uid: '1', email: 'a@b.com' },
        logout: mockLogout,
      })
      renderNavbar('/')

      await user.click(screen.getByRole('button', { name: /log out/i }))
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('does not navigate after logout on a protected path', async () => {
      const user = userEvent.setup()
      mockLogout.mockResolvedValue()
      useAuth.mockReturnValue({
        currentUser: { uid: '1', email: 'a@b.com' },
        logout: mockLogout,
      })
      renderNavbar('/dashboard')

      await user.click(screen.getByRole('button', { name: /log out/i }))
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows an alert when logout fails', async () => {
      const user = userEvent.setup()
      mockLogout.mockRejectedValue(new Error('Network error'))
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      useAuth.mockReturnValue({
        currentUser: { uid: '1', email: 'a@b.com' },
        logout: mockLogout,
      })
      renderNavbar()

      await user.click(screen.getByRole('button', { name: /log out/i }))
      expect(alertSpy).toHaveBeenCalledWith('Logout failed. Please check your connection and try again.')

      alertSpy.mockRestore()
    })
  })
})
