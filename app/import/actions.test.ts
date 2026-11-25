// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRepoTree } from '@/lib/github/fetch-repo-tree'
import { importRepoAction } from './actions'
import { initialImportState } from './import-state'

vi.mock('@/lib/github/fetch-repo-tree', () => ({ fetchRepoTree: vi.fn() }))

const fetchRepoTreeMock = vi.mocked(fetchRepoTree)

function formWith(url?: string | Blob): FormData {
  const formData = new FormData()
  if (url !== undefined) formData.set('url', url)
  return formData
}

describe('importRepoAction', () => {
  beforeEach(() => {
    fetchRepoTreeMock.mockReset()
    vi.stubEnv('GITHUB_TOKEN', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('rejects bad input without calling GitHub', () => {
    it.each([
      ['a missing url field', formWith()],
      ['an empty url', formWith('')],
      ['a whitespace only url', formWith('   ')],
      ['a file instead of text', formWith(new Blob(['x']))],
    ])('%s', async (_label, formData) => {
      const state = await importRepoAction(initialImportState, formData)

      expect(state.status).toBe('error')
      expect(fetchRepoTreeMock).not.toHaveBeenCalled()
    })

    it('a url longer than 500 characters', async () => {
      const url = `https://github.com/owner/${'r'.repeat(500)}`
      const state = await importRepoAction(initialImportState, formWith(url))

      expect(state).toEqual({ status: 'error', error: expect.stringMatching(/too long/i) })
      expect(fetchRepoTreeMock).not.toHaveBeenCalled()
    })
  })

  it('returns the URL rule error for an invalid GitHub URL', async () => {
    const state = await importRepoAction(initialImportState, formWith('http://github.com/a/b'))

    expect(state).toEqual({
      status: 'error',
      error: expect.stringMatching(/https:\/\/github\.com/),
    })
    expect(fetchRepoTreeMock).not.toHaveBeenCalled()
  })

  it('returns the kept files on success', async () => {
    fetchRepoTreeMock.mockResolvedValue({
      ok: true,
      files: [
        { path: 'src/index.ts', size: 120 },
        { path: 'package-lock.json', size: 5000 },
      ],
    })

    const state = await importRepoAction(
      initialImportState,
      formWith('  https://github.com/owner/repo  '),
    )

    expect(state).toEqual({
      status: 'success',
      owner: 'owner',
      repo: 'repo',
      files: [{ path: 'src/index.ts', size: 120 }],
    })
  })

  it('passes a GitHub error through', async () => {
    fetchRepoTreeMock.mockResolvedValue({ ok: false, error: 'GitHub rate limit reached.' })

    const state = await importRepoAction(initialImportState, formWith('https://github.com/o/r'))

    expect(state).toEqual({ status: 'error', error: 'GitHub rate limit reached.' })
  })

  describe('GitHub token', () => {
    beforeEach(() => {
      fetchRepoTreeMock.mockResolvedValue({ ok: true, files: [{ path: 'a.ts', size: 1 }] })
    })

    it('passes GITHUB_TOKEN to the client when set', async () => {
      vi.stubEnv('GITHUB_TOKEN', 'secret-token')
      await importRepoAction(initialImportState, formWith('https://github.com/o/r'))

      expect(fetchRepoTreeMock).toHaveBeenCalledWith('o', 'r', { token: 'secret-token' })
    })

    it('passes no token when GITHUB_TOKEN is empty', async () => {
      await importRepoAction(initialImportState, formWith('https://github.com/o/r'))

      expect(fetchRepoTreeMock).toHaveBeenCalledWith('o', 'r', { token: undefined })
    })
  })
})
