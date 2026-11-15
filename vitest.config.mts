import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 90000,
    fileParallelism: false,
    alias: {
      '@': rootDir,
    },
  },
})
