// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ErrorBoundary from '../src/components/ErrorBoundary'
import LeaderChart from '../src/components/LeaderChart'

afterEach(cleanup)

function Broken() {
  throw new Error('bad post')
}

describe('ErrorBoundary', () => {
  it('shows a small notice instead of crashing the whole feed', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <div>
        <ErrorBoundary small>
          <Broken />
        </ErrorBoundary>
        <p>Other posts</p>
      </div>,
    )
    expect(screen.getByText(/couldn't be shown/)).toBeTruthy()
    expect(screen.getByText('Other posts')).toBeTruthy()
    spy.mockRestore()
  })
})

describe('LeaderChart', () => {
  const items = [
    { key: 'ngo', label: 'Green Ganga Collective', value: 3, color: '#0ea5e9', sticker: null },
    { key: 'govt', label: 'Government', short: 'Govt', value: 1, color: '#3b82f6', sticker: null },
  ]

  it('gives every bar an accessible name with its score', () => {
    render(<LeaderChart items={items} />)
    expect(screen.getByRole('button', { name: 'Green Ganga Collective, 3 cleanups' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Government, 1 cleanups' })).toBeTruthy()
  })

  it('shows the full name of the bar you tap', () => {
    render(<LeaderChart items={items} />)
    const govt = screen.getByRole('button', { name: 'Government, 1 cleanups' })
    fireEvent.click(govt)
    expect(govt.getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText('Government').length).toBeGreaterThan(0)
  })
})
