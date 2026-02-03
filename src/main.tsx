import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { logHealthCheck } from './utils/databaseHealthCheck'

// Run health check in development mode
if (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== 'true') {
  console.log('🔍 Running database health check...')
  logHealthCheck().catch(err => {
    console.error('Health check failed:', err)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)