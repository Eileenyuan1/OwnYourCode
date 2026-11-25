// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import type { FetchRepoTreeResult } from '@/lib/github/fetch-repo-tree'
import type { RepoFile } from '@/lib/rules/repo-import'
import { importRepo, type ImportRepoDeps } from './import-repo'

function fakeDeps(result: FetchRepoTreeResult) {
  const fetchRepoTree = vi.fn<ImportRepoDeps['fetchRepoTree']>().mockResolvedValue(result)
  return { fetchRepoTree }
}

function files(count: number): RepoFile[] {
  return Array.from({ length: count }, (_, i) => ({ path: `src/file-${i}.ts`, size: 10 }))
}

describe('importRepo', () => {
  describe('invalid URL', () => {
    it('returns the URL error without calling GitHub', async () => {
      const deps = fakeDeps({ ok: true, files: files(1) })
      const result = await importRepo('http://github.com/owner/repo', deps)

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/https:\/\/github\.com/)
      expect(deps.fetchRepoTree).not.toHaveBeenCalled()
    })
  })

  describe('fetching', () => {
    it('fetches the tree for the parsed owner and repo', async () => {
      const deps = fakeDeps({ ok: true, files: files(1) })
      await importRepo('https://github.com/vercel/next.js.git', deps)

      expect(deps.fetchRepoTree).toHaveBeenCalledOnce()
      expect(deps.fetchRepoTree).toHaveBeenCalledWith('vercel', 'next.js')
    })

    it('passes a GitHub error through', async () => {
      const deps = fakeDeps({ ok: false, error: 'Repository not found or is private.' })

      expect(await importRepo('https://github.com/owner/repo', deps)).toEqual({
        ok: false,
        error: 'Repository not found or is private.',
      })
    })
  })

  describe('filtering', () => {
    it('drops ignored and oversized files and keeps the original order', async () => {
      const deps = fakeDeps({
        ok: true,
        files: [
          { path: 'src/b.ts', size: 10 },
          { path: 'node_modules/x/index.js', size: 10 },
          { path: 'package-lock.json', size: 10 },
          { path: 'public/logo.png', size: 10 },
          { path: 'src/big.ts', size: 102_401 },
          { path: 'src/a.ts', size: 102_400 },
        ],
      })

      expect(await importRepo('https://github.com/owner/repo', deps)).toEqual({
        ok: true,
        owner: 'owner',
        repo: 'repo',
        files: [
          { path: 'src/b.ts', size: 10 },
          { path: 'src/a.ts', size: 102_400 },
        ],
      })
    })

    it('rejects a repo with no files left after filtering', async () => {
      const deps = fakeDeps({ ok: true, files: [{ path: 'yarn.lock', size: 10 }] })
      const result = await importRepo('https://github.com/owner/repo', deps)

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/no supported source files/i)
    })

    it('rejects a repo with more than 200 files after filtering', async () => {
      const deps = fakeDeps({ ok: true, files: files(201) })
      const result = await importRepo('https://github.com/owner/repo', deps)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('201')
        expect(result.error).toContain('200')
      }
    })

    it('accepts exactly 200 files', async () => {
      const deps = fakeDeps({ ok: true, files: files(200) })
      const result = await importRepo('https://github.com/owner/repo', deps)

      expect(result.ok).toBe(true)
      if (result.ok) expect(result.files).toHaveLength(200)
    })
  })
})
