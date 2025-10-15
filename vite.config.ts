import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Determine the base path based on environment and mode
  let base = '/'
  
  if (mode === 'demo') {
    // Check if we're building on Netlify
    if (process.env.NETLIFY) {
      base = '/' // Netlify serves from root
    } else {
      base = '/adminizer-demo/' // GitHub Pages serves from subfolder
    }
  }

  return {
    plugins: [react()],
    base,
    define: {
      // Explicitly define environment variables for client-side access
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify(mode === 'demo' ? 'true' : env.VITE_DEMO_MODE),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(env.VITE_ANTHROPIC_API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['lucide-react', 'date-fns']
          }
        }
      }
    }
  }
})