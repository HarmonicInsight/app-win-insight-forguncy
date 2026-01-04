import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@insight/license': path.resolve(__dirname, './insight-common/license/typescript/index.ts'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
