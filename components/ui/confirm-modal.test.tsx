import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { ConfirmModal } from './confirm-modal'
import { renderWithIntl } from '@/tests/i18n/test-utils'

describe('ConfirmModal', () => {
  const baseProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete item?',
    message: 'This action cannot be undone.',
  }

  it('renders translated default labels', () => {
    renderWithIntl(<ConfirmModal {...baseProps} />)

    expect(screen.getByText('Delete item?')).toBeInTheDocument()
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
  })

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn()
    renderWithIntl(<ConfirmModal {...baseProps} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when confirm is clicked', () => {
    const onConfirm = vi.fn()
    renderWithIntl(<ConfirmModal {...baseProps} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledWith(undefined)
  })

  it('shows loading state', () => {
    renderWithIntl(<ConfirmModal {...baseProps} isLoading />)

    expect(screen.getByRole('button', { name: 'Loading' })).toBeInTheDocument()
  })

  it('renders with custom labels', () => {
    renderWithIntl(
      <ConfirmModal
        {...baseProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />,
    )

    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No, keep' })).toBeInTheDocument()
  })

  it('renders reason input when hasReasonInput is true', () => {
    renderWithIntl(<ConfirmModal {...baseProps} hasReasonInput />)

    expect(screen.getByText('Reason')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('disables confirm when reason is too short', () => {
    renderWithIntl(<ConfirmModal {...baseProps} hasReasonInput />)

    const confirmBtn = screen.getByRole('button', { name: 'Confirm' })
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'short' },
    })
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'this is a valid reason' },
    })
    expect(confirmBtn).toBeEnabled()
  })
})
