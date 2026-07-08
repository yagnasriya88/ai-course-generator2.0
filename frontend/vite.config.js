import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // framer-motion/lottie-react/react-markdown are pulled into the main
        // chunk via always-mounted components (Topbar, ChatBubble) — splitting
        // them into vendor chunks lets them cache/parallel-load independently
        // instead of bloating the main bundle every page pays for upfront.
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/lottie-react')) return 'vendor-lottie'
          if (
            id.includes('node_modules/react-markdown') ||
            id.includes('node_modules/remark-gfm') ||
            id.includes('node_modules/rehype-highlight')
          ) {
            return 'vendor-markdown'
          }
        },
      },
    },
  },
})
