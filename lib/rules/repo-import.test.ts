import { describe, expect, it } from 'vitest'
import { parseGitHubUrl } from './repo-import'

describe('parseGitHubUrl', () => {
  describe('returns the owner and repo', () => {
    it.each([
      ['https://github.com/vercel/next.js', 'vercel', 'next.js'],
      ['https://github.com/owner/repo/', 'owner', 'repo'],
      ['https://github.com/owner/repo.git', 'owner', 'repo'],
      ['https://www.github.com/owner/repo', 'owner', 'repo'],
    ])('%s', (url, owner, repo) => {
      expect(parseGitHubUrl(url)).toEqual({ ok: true, owner, repo })
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

  describe('rejects an empty owner or repo name', () => {
    it.each(['https://github.com//repo', 'https://github.com/owner/.git'])(
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
