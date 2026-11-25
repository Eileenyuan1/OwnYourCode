// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { fetchRepoTree } from './fetch-repo-tree'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function fakeFetch(response: Response) {
  return vi.fn<typeof fetch>().mockResolvedValue(response)
}

function requestOf(fetchMock: ReturnType<typeof fakeFetch>) {
  const [url, init] = fetchMock.mock.calls[0]
  return { url: String(url), headers: new Headers(init?.headers), init }
}

describe('fetchRepoTree', () => {
  describe('request', () => {
    it('calls the recursive tree endpoint for HEAD', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))
      await fetchRepoTree('vercel', 'next.js', { fetch: fetchMock })

      expect(requestOf(fetchMock).url).toBe(
        'https://api.github.com/repos/vercel/next.js/git/trees/HEAD?recursive=1',
      )
    })

    it('URL encodes the owner and repo', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))
      await fetchRepoTree('a b', 'c/d', { fetch: fetchMock })

      expect(requestOf(fetchMock).url).toBe(
        'https://api.github.com/repos/a%20b/c%2Fd/git/trees/HEAD?recursive=1',
      )
    })

    it('sends the GitHub API headers and disables caching', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))
      await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      const { headers, init } = requestOf(fetchMock)
      expect(headers.get('Accept')).toBe('application/vnd.github+json')
      expect(headers.get('X-GitHub-Api-Version')).toBe('2022-11-28')
      expect(headers.get('User-Agent')).toBe('ownyourcode')
      expect(init?.cache).toBe('no-store')
    })

    it('sends a bearer token when one is given', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))
      await fetchRepoTree('owner', 'repo', { fetch: fetchMock, token: 'abc123' })

      expect(requestOf(fetchMock).headers.get('Authorization')).toBe('Bearer abc123')
    })

    it('sends no Authorization header without a token', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))
      await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(requestOf(fetchMock).headers.has('Authorization')).toBe(false)
    })
  })

  describe('success', () => {
    it('maps blobs to files in GitHub order and drops folders and submodules', async () => {
      const fetchMock = fakeFetch(
        jsonResponse({
          truncated: false,
          tree: [
            { path: 'README.md', type: 'blob', size: 120, sha: 'a', mode: '100644' },
            { path: 'src', type: 'tree', sha: 'b', mode: '040000' },
            { path: 'src/index.ts', type: 'blob', size: 2048, sha: 'c', mode: '100644' },
            { path: 'vendor/lib', type: 'commit', sha: 'd', mode: '160000' },
            { path: 'src/app.ts', type: 'blob', size: 0, sha: 'e', mode: '100644' },
          ],
        }),
      )

      expect(await fetchRepoTree('owner', 'repo', { fetch: fetchMock })).toEqual({
        ok: true,
        files: [
          { path: 'README.md', size: 120 },
          { path: 'src/index.ts', size: 2048 },
          { path: 'src/app.ts', size: 0 },
        ],
      })
    })

    it('returns an empty list for an empty tree', async () => {
      const fetchMock = fakeFetch(jsonResponse({ tree: [], truncated: false }))

      expect(await fetchRepoTree('owner', 'repo', { fetch: fetchMock })).toEqual({
        ok: true,
        files: [],
      })
    })
  })

  describe('errors', () => {
    it('rejects a truncated tree as too large', async () => {
      const fetchMock = fakeFetch(
        jsonResponse({ truncated: true, tree: [{ path: 'a.ts', type: 'blob', size: 1 }] }),
      )
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/too large/i)
    })

    it('explains a 404 as not found or private', async () => {
      const fetchMock = fakeFetch(jsonResponse({ message: 'Not Found' }, 404))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/not found or (is )?private/i)
    })

    it.each([403, 429])('explains a %i as the rate limit', async (status) => {
      const fetchMock = fakeFetch(jsonResponse({ message: 'rate limit' }, status))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/rate limit/i)
    })

    it.each([409, 500, 502])('returns a generic GitHub error for a %i', async (status) => {
      const fetchMock = fakeFetch(jsonResponse({ message: 'nope' }, status))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/GitHub/)
    })

    it('returns a network error when fetch throws', async () => {
      const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('fetch failed'))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/could not reach GitHub/i)
    })

    it('returns a generic GitHub error for a body that is not JSON', async () => {
      const fetchMock = fakeFetch(new Response('<html>oops</html>', { status: 200 }))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/GitHub/)
    })

    it.each([
      ['no tree field', { truncated: false }],
      ['tree is not an array', { tree: 'x', truncated: false }],
      ['blob without a size', { tree: [{ path: 'a.ts', type: 'blob' }] }],
      ['blob without a path', { tree: [{ type: 'blob', size: 1 }] }],
    ])('returns a generic GitHub error when the body has %s', async (_label, body) => {
      const fetchMock = fakeFetch(jsonResponse(body))
      const result = await fetchRepoTree('owner', 'repo', { fetch: fetchMock })

      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error).toMatch(/GitHub/)
    })
  })
})
