import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-orangekit-ethers',
      resolveId(id: string, importer?: string) {
        if (id === 'ethers' && importer?.includes('orangekit-contracts')) {
          return path.resolve('node_modules/ethers/lib.esm/index.js')
        }
      },
    },
  ],
  resolve: {
    dedupe: ['ethers', 'viem', 'wagmi', '@rainbow-me/rainbowkit'],
    alias: { '@': '/src' },
  },
  optimizeDeps: {
    include: ['ethers'],
  },
})
