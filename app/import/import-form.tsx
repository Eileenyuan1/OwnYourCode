'use client'

import { useActionState } from 'react'
import { importRepoAction } from './actions'
import { initialImportState } from './import-state'

function formatSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

export function ImportForm() {
  const [state, formAction, pending] = useActionState(importRepoAction, initialImportState)

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="repo-url" className="text-sm font-medium">
          GitHub repository URL
        </label>
        <div className="flex gap-2">
          <input
            id="repo-url"
            name="url"
            type="url"
            required
            placeholder="https://github.com/owner/repo"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
          >
            {pending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {state.status === 'error' && (
          <p className="text-red-600 dark:text-red-400">{state.error}</p>
        )}

        {state.status === 'success' && (
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="font-mono text-lg font-semibold">{`${state.owner}/${state.repo}`}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {state.files.length} {state.files.length === 1 ? 'file' : 'files'} kept
              </p>
            </div>
            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 font-mono text-sm dark:divide-zinc-800 dark:border-zinc-800">
              {state.files.map((file) => (
                <li key={file.path} className="flex justify-between gap-4 px-3 py-1.5">
                  <span className="truncate">{file.path}</span>
                  <span className="shrink-0 text-zinc-500">{formatSize(file.size)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
