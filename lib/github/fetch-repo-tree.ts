import type { RepoFile } from '@/lib/rules/repo-import'

export type FetchRepoTreeResult =
  | { ok: true; files: RepoFile[] }
  | { ok: false; error: string }

export type FetchRepoTreeOptions = {
  token?: string
  fetch?: typeof fetch
}

const GITHUB_API = 'https://api.github.com'

const ERRORS = {
  notFound: 'Repository not found or is private. Only public repos can be imported.',
  rateLimited: 'GitHub rate limit reached. Please try again later.',
  tooLarge: 'This repository is too large to import.',
  network: 'Could not reach GitHub. Check your connection and try again.',
  unexpected: 'GitHub returned an unexpected response. Please try again.',
} as const

function fail(error: string): FetchRepoTreeResult {
  return { ok: false, error }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Turns the GitHub tree response into kept files, or null if the shape is wrong.
function parseTree(body: unknown): { truncated: boolean; files: RepoFile[] } | null {
  if (!isRecord(body) || !Array.isArray(body.tree)) return null

  const files: RepoFile[] = []
  for (const entry of body.tree) {
    if (!isRecord(entry)) return null
    if (entry.type !== 'blob') continue
    if (typeof entry.path !== 'string' || typeof entry.size !== 'number') return null
    files.push({ path: entry.path, size: entry.size })
  }

  return { truncated: body.truncated === true, files }
}

export async function fetchRepoTree(
  owner: string,
  repo: string,
  options: FetchRepoTreeOptions = {},
): Promise<FetchRepoTreeResult> {
  const fetchImpl = options.fetch ?? fetch
  const url = `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/HEAD?recursive=1`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ownyourcode',
  }
  if (options.token) headers.Authorization = `Bearer ${options.token}`

  let response: Response
  try {
    response = await fetchImpl(url, { headers, cache: 'no-store' })
  } catch {
    return fail(ERRORS.network)
  }

  if (response.status === 404) return fail(ERRORS.notFound)
  if (response.status === 403 || response.status === 429) return fail(ERRORS.rateLimited)
  if (!response.ok) return fail(ERRORS.unexpected)

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return fail(ERRORS.unexpected)
  }

  const tree = parseTree(body)
  if (!tree) return fail(ERRORS.unexpected)
  if (tree.truncated) return fail(ERRORS.tooLarge)

  return { ok: true, files: tree.files }
}
