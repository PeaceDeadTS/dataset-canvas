/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const cdnBase = process.env.VITE_CDN_BASE
const normalizedBase = cdnBase
  ? (cdnBase.endsWith('/') ? cdnBase : `${cdnBase}/`)
  : '/'

// https://vitejs.dev/config/
export default defineConfig({
  base: normalizedBase,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['**/backend/**', '**/node_modules/**'],
  },
})

