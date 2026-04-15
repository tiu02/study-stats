import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Landing from './Landing'
import { useAuth } from '../context/AuthContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

function renderLanding() {
  return render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  )
}

describe('Landing', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useAuth.mockReturnValue({ currentUser: null })
  })

  it('renders the app name', () => {
    renderLanding()
    expect(screen.getByRole('heading', { name: /studystats/i })).toBeInTheDocument()
  })

  it('shows Get Started button when logged out', () => {
    renderLanding()
    expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument()
  })

  it('navigates to /signup when Get Started is clicked', async () => {
    const user = userEvent.setup()
    renderLanding()
    await user.click(screen.getByRole('button', { name: /get started/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  it('redirects to /dashboard when logged in', () => {
    useAuth.mockReturnValue({ currentUser: { uid: 'u1' } })
    renderLanding()
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('renders four feature cards', () => {
    renderLanding()
    const cards = screen.getAllByRole('link')
    expect(cards).toHaveLength(4)
  })

  it('navigates to /dashboard when Weekly Progress card is clicked', async () => {
    const user = userEvent.setup()
    renderLanding()
    await user.click(screen.getByRole('link', { name: /weekly progress/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('activates feature card navigation via Enter key', async () => {
    const user = userEvent.setup()
    renderLanding()
    const card = screen.getByRole('link', { name: /log sessions/i })
    card.focus()
    await user.keyboard('{Enter}')
    expect(mockNavigate).toHaveBeenCalledWith('/sessions')
  })
})
