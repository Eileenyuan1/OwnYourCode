import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { importRepoAction } from './actions'
import { ImportForm } from './import-form'

vi.mock('./actions', () => ({ importRepoAction: vi.fn() }))

const actionMock = vi.mocked(importRepoAction)

async function submit(url: string) {
  fireEvent.change(screen.getByLabelText(/github repository url/i), {
    target: { value: url },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /import/i }))
  })
}

describe('ImportForm', () => {
  beforeEach(() => {
    actionMock.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders a required URL input and an import button', () => {
    render(<ImportForm />)

    const input = screen.getByLabelText(/github repository url/i)
    expect(input).toHaveProperty('required', true)
    expect(input).toHaveProperty('name', 'url')
    expect(screen.getByRole('button', { name: /import/i })).toHaveProperty('disabled', false)
  })

  it('sends the pasted URL to the action', async () => {
    actionMock.mockResolvedValue({ status: 'error', error: 'x' })
    render(<ImportForm />)

    await submit('https://github.com/owner/repo')

    expect(actionMock).toHaveBeenCalledOnce()
    const formData = actionMock.mock.calls[0][1]
    expect(formData.get('url')).toBe('https://github.com/owner/repo')
  })

  it('shows the error in a live region', async () => {
    actionMock.mockResolvedValue({ status: 'error', error: 'Repository not found or is private.' })
    render(<ImportForm />)

    await submit('https://github.com/owner/missing')

    const message = await screen.findByText('Repository not found or is private.')
    expect(message.closest('[aria-live="polite"]')).not.toBeNull()
  })

  it('shows the repo name, file count and kept files on success', async () => {
    actionMock.mockResolvedValue({
      status: 'success',
      owner: 'owner',
      repo: 'repo',
      files: [
        { path: 'README.md', size: 512 },
        { path: 'src/index.ts', size: 2048 },
      ],
    })
    render(<ImportForm />)

    await submit('https://github.com/owner/repo')

    expect(await screen.findByText('owner/repo')).toBeTruthy()
    expect(screen.getByText(/2 files kept/i)).toBeTruthy()
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['README.md512 B', 'src/index.ts2.0 KB'])
  })

  it('uses the singular for one kept file', async () => {
    actionMock.mockResolvedValue({
      status: 'success',
      owner: 'o',
      repo: 'r',
      files: [{ path: 'a.ts', size: 1 }],
    })
    render(<ImportForm />)

    await submit('https://github.com/o/r')

    expect(await screen.findByText(/1 file kept/i)).toBeTruthy()
  })

  it('disables the button while the import is pending', async () => {
    actionMock.mockReturnValue(new Promise(() => {}))
    render(<ImportForm />)

    await submit('https://github.com/owner/repo')

    const button = screen.getByRole('button', { name: /importing/i })
    expect(button).toHaveProperty('disabled', true)
  })
})
