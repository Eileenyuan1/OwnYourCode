import type { RepoFile } from '@/lib/rules/repo-import'

// Lives outside actions.ts because a 'use server' file may only export async functions.
export type ImportState =
  | { status: 'idle' }
  | { status: 'error'; error: string }
  | { status: 'success'; owner: string; repo: string; files: RepoFile[] }

export const initialImportState: ImportState = { status: 'idle' }
