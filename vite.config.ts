import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'
import { defineConfig } from 'vitest/config'

const probeProxy: Record<string, ProxyOptions> = {
  '/probe-assets/buildroot-bzimage.bin': {
    target: 'https://i.copy.sh',
    changeOrigin: true,
    headers: {
      'user-agent': 'KernelLab-TechnicalProbe/0.1',
    },
    rewrite: () => '/buildroot-bzimage.bin',
    bypass(request) {
      request.headers['user-agent'] = 'KernelLab-TechnicalProbe/0.1'
      delete request.headers.origin
      delete request.headers.referer
      delete request.headers.range
      delete request.headers['x-accept-encoding']
    },
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: probeProxy,
  },
  preview: {
    proxy: probeProxy,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1_200,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
