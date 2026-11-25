# Plan: Repo Import Page (PRD F2)

## Context

PRD F2 needs a page where a student pastes a public GitHub URL, the app fetches the
repo's file tree, applies the §5.1 rules, and shows either the kept files or an error.

The §5.1 rules already exist and are tested in `lib/rules/repo-import.ts`:

- `parseGitHubUrl(url)` returns `{ ok, owner, repo }` or `{ ok: false, error }`
- `shouldIgnorePath(path)` covers ignored folders, lock files and extensions
- `filterRepoFiles(files: RepoFile[])` applies the size limit, the 200 file limit and
  the "no files left" check, keeping the original order

What is missing is the GitHub fetch, the glue between the pieces, and the UI.

## Decisions

- Fetch the default branch via `HEAD`. Pinning a commit SHA waits until citations
  need a fixed commit.
- No auth and no database on this branch. The Server Action gets a
  `TODO(F1)` comment where the sign in and rate limit checks will go.
- "Re-importing reuses the repo" (F2) is out of scope until Prisma exists.
- Use a Server Action with `useActionState`, not a Route Handler (Next.js 16
  forms guide). The form posts only to our own server.
- `app/import/page.tsx` uses a default export because Next.js requires it; this is
  the only exception to the named exports rule.

## Commits

### 1. `feat: add GitHub repo tree client`

Files: `lib/github/fetch-repo-tree.ts`, `lib/github/fetch-repo-tree.test.ts`

Tests are written first, then the implementation; both land in this commit.

- `fetchRepoTree(owner, repo, options?)` returns
  `{ ok: true, files: RepoFile[] } | { ok: false, error: string }`, reusing the
  `RepoFile` type from `lib/rules/repo-import.ts`.
- Options: `token?: string` and an injectable `fetch` for tests.
- Request: `GET https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1`
  - `owner` and `repo` go through `encodeURIComponent`
  - headers: `Accept: application/vnd.github+json`,
    `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: ownyourcode`,
    `Authorization: Bearer <token>` only when a token is given
  - `cache: 'no-store'`
- Response handling:
  - keep entries with `type === "blob"`, map to `{ path, size }`, keep GitHub's order
  - drop `tree` (folders) and `commit` (submodules) entries
  - `truncated: true` → error: repo too large to import
- Error mapping, each with a friendly message:
  - 404 → repo not found or private
  - 403 / 429 → GitHub rate limit reached, try again later
  - any other non OK status → generic GitHub error
  - `fetch` throws → network error
  - malformed JSON body → generic GitHub error
- Tests stub `fetch`; they never hit the network. Cases: success mapping,
  blob only filtering, order kept, URL encoding, token header present or absent,
  each error case above.

### 2. `feat: add importRepo service`

Files: `lib/services/import-repo.ts`, `lib/services/import-repo.test.ts`

Tests are written first, then the implementation; both land in this commit.

- `importRepo(url, deps)` where `deps.fetchRepoTree` is injected.
- Flow: `parseGitHubUrl` → `fetchRepoTree` → `filterRepoFiles`, stopping at the
  first error.
- Returns `{ ok: true, owner, repo, files } | { ok: false, error }`.
- Plain TypeScript, no Next.js imports.
- Tests use a fake `fetchRepoTree`. Cases: invalid URL never calls the fetcher,
  fetch error is passed through, filter error (0 files, over 200 files) is passed
  through, success returns owner, repo and the filtered files in order.

### 3. `feat: add repo import page`

Files: `app/import/actions.ts`, `app/import/import-form.tsx`,
`app/import/import-form.test.tsx`, `app/import/page.tsx`

- `actions.ts` (`'use server'`):
  `importRepoAction(prevState: ImportState, formData: FormData): Promise<ImportState>`
  - `// TODO(F1): require sign in and apply per user rate limit` at the top
  - reads `url` from `FormData`; rejects non strings, empty values and values over
    a length cap (e.g. 500 chars)
  - calls `importRepo(url, { fetchRepoTree })` with `process.env.GITHUB_TOKEN`
    (optional; secrets only in env vars)
  - returns only what the UI renders:
    `{ status: 'idle' | 'error' | 'success', error?, owner?, repo?, files? }`
- `import-form.tsx` (`'use client'`):
  - `useActionState(importRepoAction, { status: 'idle' })`
  - URL input with `name="url"`, `type="url"`, `required`, label
  - submit button disabled while `pending`
  - error shown in an `aria-live="polite"` region
  - on success: `owner/repo`, kept file count, and the list of paths with sizes
- `import-form.test.tsx`: mocks `./actions`; checks the error message renders,
  the file list renders on success, and the button is disabled while pending.
- `page.tsx`: thin server component with a heading and `<ImportForm />`.
- `app/page.tsx` is left unchanged.

## Verification

After each commit:

- `npm test`
- `npm run lint`

After commit 3:

- `npm run build`
- `npm run dev`, open `/import`, and try:
  - a small public repo → kept file list shows
  - `http://github.com/a/b` → URL error
  - a repo that does not exist → not found error
  - a repo with more than 200 kept files → limit error with the count
