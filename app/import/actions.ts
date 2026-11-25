'use server'

import { fetchRepoTree } from '@/lib/github/fetch-repo-tree'
import { importRepo } from '@/lib/services/import-repo'
import type { ImportState } from './import-state'

const MAX_URL_LENGTH = 500

export async function importRepoAction(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  // TODO(F1): require sign in and apply a per user rate limit before calling GitHub.

  const url = formData.get('url')
  if (typeof url !== 'string' || url.trim() === '') {
    return { status: 'error', error: 'Please paste a GitHub repository URL.' }
  }
  if (url.length > MAX_URL_LENGTH) {
    return { status: 'error', error: 'That URL is too long.' }
  }

  const token = process.env.GITHUB_TOKEN || undefined
  const result = await importRepo(url.trim(), {
    fetchRepoTree: (owner, repo) => fetchRepoTree(owner, repo, { token }),
  })
  if (!result.ok) return { status: 'error', error: result.error }

  // Return only what the page renders.
  return {
    status: 'success',
    owner: result.owner,
    repo: result.repo,
    files: result.files.map(({ path, size }) => ({ path, size })),
  }
}
