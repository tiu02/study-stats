import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../context/AuthContext'

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PrivateRoute', () => {
  it('renders a loading spinner when loading is true', () => {
    useAuth.mockReturnValue({ currentUser: null, loading: true })

    renderWithRouter(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('renders the child component when currentUser exists', () => {
    useAuth.mockReturnValue({
      currentUser: { uid: '123', email: 'test@test.com' },
      loading: false,
    })

    renderWithRouter(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('redirects to /login when currentUser is null and loading is false', () => {
    useAuth.mockReturnValue({ currentUser: null, loading: false })

    const { container } = renderWithRouter(
      <PrivateRoute>
        <div>Protected Content</div>
      </PrivateRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    // Navigate renders nothing visible — verify the child is not shown
    expect(container.innerHTML).toBe('')
  })
})
