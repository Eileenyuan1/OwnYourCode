import type { FetchRepoTreeResult } from '@/lib/github/fetch-repo-tree'
import { filterRepoFiles, parseGitHubUrl, type RepoFile } from '@/lib/rules/repo-import'

export type ImportRepoDeps = {
  fetchRepoTree: (owner: string, repo: string) => Promise<FetchRepoTreeResult>
}

export type ImportRepoResult =
  | { ok: true; owner: string; repo: string; files: RepoFile[] }
  | { ok: false; error: string }

export async function importRepo(url: string, deps: ImportRepoDeps): Promise<ImportRepoResult> {
  const parsed = parseGitHubUrl(url)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const tree = await deps.fetchRepoTree(parsed.owner, parsed.repo)
  if (!tree.ok) return { ok: false, error: tree.error }

  const filtered = filterRepoFiles(tree.files)
  if (!filtered.ok) return { ok: false, error: filtered.error }

  return { ok: true, owner: parsed.owner, repo: parsed.repo, files: filtered.files }
}
