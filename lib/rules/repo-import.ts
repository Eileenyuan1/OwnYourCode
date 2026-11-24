export type ParseGitHubUrlResult =
  | { ok: true; owner: string; repo: string }
  | { ok: false; error: string }

export function parseGitHubUrl(url: string): ParseGitHubUrlResult {
  void url
  return { ok: false, error: 'not implemented' }
}
