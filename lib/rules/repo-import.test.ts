import { describe, expect, it } from 'vitest'
import { parseGitHubUrl } from './repo-import'

describe('parseGitHubUrl', () => {
  it('returns the owner and repo for https://github.com/{owner}/{repo}', () => {
    expect(parseGitHubUrl('https://github.com/vercel/next.js')).toEqual({
      ok: true,
      owner: 'vercel',
      repo: 'next.js',
    })
  })

  it('accepts a trailing slash', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo/')).toEqual({
      ok: true,
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('accepts a .git suffix and strips it from the repo name', () => {
    expect(parseGitHubUrl('https://github.com/owner/repo.git')).toEqual({
      ok: true,
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('accepts www.github.com', () => {
    expect(parseGitHubUrl('https://www.github.com/owner/repo')).toEqual({
      ok: true,
      owner: 'owner',
      repo: 'repo',
    })
  })

  it('rejects http://', () => {
    expect(parseGitHubUrl('http://github.com/owner/repo').ok).toBe(false)
  })

  describe('rejects strings that are not URLs', () => {
    it.each(['', 'not a url', 'github.com/owner/repo', 'owner/repo'])(
      '%j',
      (input) => {
        expect(parseGitHubUrl(input).ok).toBe(false)
      },
    )
  })

  describe('rejects hosts other than github.com', () => {
    it.each([
      'https://gitlab.com/owner/repo',
      'https://bitbucket.org/owner/repo',
      'https://github.com.evil.com/owner/repo',
    ])('%s', (url) => {
      expect(parseGitHubUrl(url).ok).toBe(false)
    })
  })

  describe('rejects a missing repo name', () => {
    it.each(['https://github.com/owner', 'https://github.com/owner/'])(
      '%s',
      (url) => {
        expect(parseGitHubUrl(url).ok).toBe(false)
      },
    )
  })

  describe('rejects extra path segments', () => {
    it.each([
      'https://github.com/owner/repo/tree/main',
      'https://github.com/owner/repo/extra',
    ])('%s', (url) => {
      expect(parseGitHubUrl(url).ok).toBe(false)
    })
  })

  it('includes an error message when rejecting', () => {
    const result = parseGitHubUrl('https://gitlab.com/owner/repo')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toEqual(expect.any(String))
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})
