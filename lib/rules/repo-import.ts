export type ParseGitHubUrlResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; error: string }

const ALLOWED_HOSTS = ['github.com', 'www.github.com']

const INVALID: ParseGitHubUrlResult = {
  ok: false,
  error: 'Expected a URL like https://github.com/{owner}/{repo}',
}

export function parseGitHubUrl(url: string): ParseGitHubUrlResult {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return INVALID
  }

  if (parsed.protocol !== 'https:') return INVALID
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) return INVALID

  const segments = parsed.pathname.replace(/\/$/, '').split('/').slice(1)
  if (segments.length !== 2) return INVALID

  const owner = segments[0]
  const repo = segments[1].replace(/\.git$/, '')
  if (!owner || !repo) return INVALID

  return { ok: true, owner, repo }
}

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next'])

const LOCK_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
  'npm-shrinkwrap.json',
  'Cargo.lock',
  'Gemfile.lock',
  'poetry.lock',
  'Pipfile.lock',
  'uv.lock',
  'composer.lock',
  'go.sum',
])

const IGNORED_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff', '.avif', '.heic', '.svg',
  // Videos
  '.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v',
  // Fonts
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  // Binaries
  '.exe', '.dll', '.so', '.dylib', '.bin', '.o', '.a', '.class', '.jar', '.wasm', '.pyc',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.pdf', '.mp3', '.wav',
])

export function shouldIgnorePath(path: string): boolean {
  const segments = path.split('/')
  const fileName = segments[segments.length - 1]

  if (segments.slice(0, -1).some((dir) => IGNORED_DIRS.has(dir))) return true
  if (LOCK_FILES.has(fileName)) return true

  const dot = fileName.lastIndexOf('.')
  return dot > 0 && IGNORED_EXTENSIONS.has(fileName.slice(dot).toLowerCase())
}

export type RepoFile = { path: string; size: number }

export type FilterRepoFilesResult =
  | { ok: true; files: RepoFile[] }
  | { ok: false; error: string }

export function filterRepoFiles(files: RepoFile[]): FilterRepoFilesResult {
  void files
  return { ok: false, error: 'not implemented' }
}
