import type { Metadata } from 'next'
import { ImportForm } from './import-form'

export const metadata: Metadata = {
  title: 'Import a repo · OwnYourCode',
}

// Next.js requires a default export for pages; the only exception to the named exports rule.
export default function ImportPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Import a GitHub repo</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Paste a public repository URL. We fetch its file tree from the default branch and
          show the files OwnYourCode will use.
        </p>
      </div>
      <ImportForm />
    </main>
  )
}
