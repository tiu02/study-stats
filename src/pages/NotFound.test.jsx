import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import NotFound from './NotFound'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await import('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  )
}

describe('NotFound', () => {
  beforeEach(() => mockNavigate.mockClear())

  it('renders 404 heading', () => {
    renderNotFound()
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('renders the error message', () => {
    renderNotFound()
    expect(screen.getByText(/page you're looking for doesn't exist/i)).toBeInTheDocument()
  })

  it('renders a Back to Home button', () => {
    renderNotFound()
    expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument()
  })

  it('navigates to / when Back to Home is clicked', async () => {
    const user = userEvent.setup()
    renderNotFound()
    await user.click(screen.getByRole('button', { name: /back to home/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
