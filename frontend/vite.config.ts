import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    exclude: ['@zama-fhe/relayer-sdk'],
  },
  build: {
    rollupOptions: {
      external: ['@zama-fhe/relayer-sdk'],
      output: {
        globals: {
          '@zama-fhe/relayer-sdk': 'ZamaRelayerSDK',
        },
      },
    },
  },
})
