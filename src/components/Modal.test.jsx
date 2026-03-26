import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

vi.mock('./Modal.css', () => ({}))

describe('Modal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------- Visibility ---------------

  it('renders children when open is true', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Test modal"><p>Modal content</p></Modal>)
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('renders nothing when open is false', () => {
    const { container } = render(<Modal open={false} onClose={onClose} ariaLabel="Test modal"><p>Modal content</p></Modal>)
    expect(container.firstChild).toBeNull()
  })

  // --------------- ARIA attributes ---------------

  it('sets role="dialog" by default', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="My dialog"><p>content</p></Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('accepts a custom role prop', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Alert" role="alertdialog"><p>content</p></Modal>)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('sets aria-label on the modal content', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Add session"><p>content</p></Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Add session')
  })

  it('sets aria-describedby when provided', () => {
    render(
      <Modal open={true} onClose={onClose} ariaLabel="Delete" ariaDescribedBy="desc-id">
        <p id="desc-id">Cannot be undone.</p>
      </Modal>
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'desc-id')
  })

  it('sets aria-modal="true" on the content element', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Test"><p>content</p></Modal>)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  // --------------- className ---------------

  it('appends className to the overlay when provided', () => {
    const { container } = render(
      <Modal open={true} onClose={onClose} ariaLabel="Test" className="modal-overlay-centered">
        <p>content</p>
      </Modal>
    )
    expect(container.firstChild).toHaveClass('modal-overlay')
    expect(container.firstChild).toHaveClass('modal-overlay-centered')
  })

  it('overlay has only modal-overlay class when className not provided', () => {
    const { container } = render(
      <Modal open={true} onClose={onClose} ariaLabel="Test"><p>content</p></Modal>
    )
    expect(container.firstChild).toHaveClass('modal-overlay')
    expect(container.firstChild.className).toBe('modal-overlay')
  })

  // --------------- Keyboard ---------------

  it('calls onClose when Escape key is pressed', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Test"><p>content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for other keys', () => {
    render(<Modal open={true} onClose={onClose} ariaLabel="Test"><p>content</p></Modal>)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  // --------------- Overlay click ---------------

  it('calls onClose when clicking directly on the overlay', () => {
    const { container } = render(
      <Modal open={true} onClose={onClose} ariaLabel="Test"><p>content</p></Modal>
    )
    const overlay = container.querySelector('.modal-overlay')
    fireEvent.click(overlay, { target: overlay })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside modal content', () => {
    render(
      <Modal open={true} onClose={onClose} ariaLabel="Test">
        <button>Inside button</button>
      </Modal>
    )
    fireEvent.click(screen.getByText('Inside button'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
