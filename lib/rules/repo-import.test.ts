import { describe, expect, it } from 'vitest'
import {
  filterRepoFiles,
  parseGitHubUrl,
  shouldIgnorePath,
  type RepoFile,
} from './repo-import'

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

describe('shouldIgnorePath', () => {
  describe('ignores files inside ignored directories at any depth', () => {
    it.each([
      'node_modules/react/index.js',
      'packages/web/node_modules/lodash/index.js',
      '.git/config',
      'dist/index.js',
      'packages/api/dist/server.js',
      'build/main.js',
      '.next/server/app.js',
    ])('%s', (path) => {
      expect(shouldIgnorePath(path)).toBe(true)
    })
  })

  describe('ignores lock files at any depth', () => {
    it.each(['package-lock.json', 'yarn.lock', 'apps/web/pnpm-lock.yaml'])(
      '%s',
      (path) => {
        expect(shouldIgnorePath(path)).toBe(true)
      },
    )
  })

  describe('ignores images, videos, fonts and binaries', () => {
    it.each([
      'public/logo.png',
      'public/icon.svg',
      'assets/demo.mp4',
      'public/fonts/inter.woff2',
      'bin/tool.exe',
      'lib/module.wasm',
    ])('%s', (path) => {
      expect(shouldIgnorePath(path)).toBe(true)
    })
  })

  it('matches extensions case-insensitively', () => {
    expect(shouldIgnorePath('public/Screenshot.PNG')).toBe(true)
  })

  describe('does not ignore normal source files', () => {
    it.each([
      'src/index.ts',
      'src/build-utils.ts',
      'docs/distance.md',
      'src/rebuild/index.ts',
      '.gitignore',
      '.github/workflows/ci.yml',
      'package.json',
      'src/lock.ts',
      'src/fonts.ts',
      'README.md',
    ])('%s', (path) => {
      expect(shouldIgnorePath(path)).toBe(false)
    })
  })
})

describe('filterRepoFiles', () => {
  const file = (path: string, size = 1000): RepoFile => ({ path, size })
  const sourceFiles = (count: number): RepoFile[] =>
    Array.from({ length: count }, (_, i) => file(`src/file-${i}.ts`))

  it('keeps normal files in their original order', () => {
    const files = [file('src/b.ts'), file('README.md'), file('src/a.ts')]
    expect(filterRepoFiles(files)).toEqual({ ok: true, files })
  })

  it('drops ignored paths', () => {
    const result = filterRepoFiles([
      file('src/index.ts'),
      file('node_modules/react/index.js'),
      file('public/logo.png'),
      file('yarn.lock'),
    ])
    expect(result).toEqual({ ok: true, files: [file('src/index.ts')] })
  })

  describe('file size limit', () => {
    it('keeps a file of exactly 102,400 bytes', () => {
      const files = [file('src/at-limit.ts', 102_400)]
      expect(filterRepoFiles(files)).toEqual({ ok: true, files })
    })

    it('skips a file of 102,401 bytes', () => {
      const result = filterRepoFiles([
        file('src/index.ts'),
        file('src/too-big.ts', 102_401),
      ])
      expect(result).toEqual({ ok: true, files: [file('src/index.ts')] })
    })
  })

  describe('file count limit', () => {
    it('accepts exactly 200 files', () => {
      const files = sourceFiles(200)
      expect(filterRepoFiles(files)).toEqual({ ok: true, files })
    })

    it('rejects 201 files', () => {
      expect(filterRepoFiles(sourceFiles(201)).ok).toBe(false)
    })

    it('explains the rejection with the file count and the limit', () => {
      const result = filterRepoFiles(sourceFiles(245))
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('245')
        expect(result.error).toContain('200')
      }
    })

    it('does not count files skipped for size', () => {
      const small = sourceFiles(150)
      const big = Array.from({ length: 100 }, (_, i) =>
        file(`data/big-${i}.json`, 200_000),
      )
      expect(filterRepoFiles([...small, ...big])).toEqual({
        ok: true,
        files: small,
      })
    })

    it('does not count ignored files', () => {
      const kept = sourceFiles(150)
      const ignored = Array.from({ length: 300 }, (_, i) =>
        file(`node_modules/pkg/file-${i}.js`),
      )
      expect(filterRepoFiles([...kept, ...ignored])).toEqual({
        ok: true,
        files: kept,
      })
    })
  })

  describe('rejects a repo with no files left after filtering', () => {
    it.each<[string, RepoFile[]]>([
      ['empty input', []],
      ['only ignored files', [file('node_modules/a.js'), file('logo.png')]],
      ['only oversized files', [file('src/huge.ts', 500_000)]],
    ])('%s', (_, files) => {
      const result = filterRepoFiles(files)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0)
    })
  })
})
