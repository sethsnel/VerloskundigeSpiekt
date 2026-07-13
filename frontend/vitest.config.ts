import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
export default defineConfig({ resolve: { alias: { '@': root, lib: `${root}lib`, content: `${root}content`, config: `${root}config` } }, test: { environment: 'jsdom', setupFiles: ['./test/setup.ts'], include: ['test/component/**/*.test.tsx'] } })
