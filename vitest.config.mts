import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vitest requires a default export for its config file.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" alias from tsconfig.json natively.
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
  },
})
