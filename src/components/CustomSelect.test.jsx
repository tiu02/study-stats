import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import CustomSelect from './CustomSelect'

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'complete', label: 'Complete' },
  { value: 'incomplete', label: 'Incomplete' },
]

function renderSelect(props = {}) {
  const onChange = props.onChange || vi.fn()
  const { rerender, ...rest } = render(
    <CustomSelect
      id="test-select"
      value={props.value ?? 'all'}
      onChange={onChange}
      options={OPTIONS}
      isActive={props.isActive ?? false}
      {...(props.extraProps || {})}
    />
  )
  return { onChange, rerender, ...rest }
}

describe('CustomSelect', () => {
  it('renders the selected option label', () => {
    renderSelect({ value: 'complete' })
    expect(screen.getByRole('button', { name: /complete/i })).toBeInTheDocument()
  })

  it('shows the first option label when no value matches', () => {
    renderSelect({ value: '' })
    expect(screen.getByRole('button').textContent).toMatch(/all/i)
  })

  it('opens the dropdown on click', async () => {
    const user = userEvent.setup()
    renderSelect()
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes the dropdown when an option is selected', async () => {
    const user = userEvent.setup()
    renderSelect()
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: 'Complete' }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('calls onChange with the selected value', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderSelect({ onChange })
    await user.click(screen.getByRole('button'))
    await user.click(screen.getByRole('option', { name: 'Incomplete' }))
    expect(onChange).toHaveBeenCalledWith('incomplete')
  })

  it('marks the current value option as selected', async () => {
    const user = userEvent.setup()
    renderSelect({ value: 'complete' })
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('option', { name: 'Complete' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('option', { name: 'All' })).toHaveAttribute('aria-selected', 'false')
  })

  it('closes on Escape key', async () => {
    const user = userEvent.setup()
    renderSelect()
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('adds cs-trigger-active class when isActive is true', () => {
    renderSelect({ isActive: true })
    expect(screen.getByRole('button')).toHaveClass('cs-trigger-active')
  })

  it('does not add cs-trigger-active class when isActive is false', () => {
    renderSelect({ isActive: false })
    expect(screen.getByRole('button')).not.toHaveClass('cs-trigger-active')
  })

  it('closes on outside click', async () => {
    const user = userEvent.setup()
    const { container } = renderSelect()
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.click(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
