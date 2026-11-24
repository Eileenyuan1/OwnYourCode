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

  const [owner, repo] = segments
  return { ok: true, owner, repo: repo.replace(/\.git$/, '') }
}
