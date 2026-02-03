import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Prioritize process.env (Netlify) over .env files (local dev)
  // This ensures environment variables set in Netlify dashboard are used during builds
  const getEnvVar = (key: string) => process.env[key] || env[key]

  // Get environment variables with Netlify support
  const VITE_SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL')
  const VITE_SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY')
  const VITE_ANTHROPIC_API_KEY = getEnvVar('VITE_ANTHROPIC_API_KEY')
  const VITE_DEMO_MODE = mode === 'demo' ? 'true' : getEnvVar('VITE_DEMO_MODE')

  // Log environment variable status during build (helps diagnose issues)
  if (command === 'build') {
    console.log('\n🔧 Build Environment Variables:')
    console.log(`  Mode: ${mode}`)
    console.log(`  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL ? '✓ Found' : '✗ Missing'}`)
    console.log(`  VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY ? '✓ Found' : '✗ Missing'}`)
    console.log(`  VITE_ANTHROPIC_API_KEY: ${VITE_ANTHROPIC_API_KEY ? '✓ Found' : '✗ Missing'}`)
    console.log(`  VITE_DEMO_MODE: ${VITE_DEMO_MODE}`)
    console.log(`  Running on Netlify: ${process.env.NETLIFY ? 'Yes' : 'No'}`)

    // Validate required variables
    if (!VITE_SUPABASE_URL || !VITE_SUPABASE_ANON_KEY) {
      console.error('\n❌ ERROR: Missing required Supabase environment variables!')
      console.error('   Please ensure these are set in Netlify dashboard or .env file:')
      console.error('   - VITE_SUPABASE_URL')
      console.error('   - VITE_SUPABASE_ANON_KEY')
      throw new Error('Missing required environment variables')
    }
  }

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
      // These will be embedded into the built JavaScript files
      'import.meta.env.VITE_DEMO_MODE': JSON.stringify(VITE_DEMO_MODE),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(VITE_ANTHROPIC_API_KEY)
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