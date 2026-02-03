import React from 'react'
import { Eye, Info } from 'lucide-react'
import { isDemoMode } from '../../lib/demo'

const DemoModeIndicator: React.FC = () => {
  if (!isDemoMode) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-center text-sm font-medium shadow-lg">
      <div className="flex items-center justify-center space-x-2">
        <Eye className="h-4 w-4" />
        <span>Portfolio Demo Mode</span>
        <div className="group relative">
          <Info className="h-4 w-4 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            This is a demonstration version with sample data for portfolio purposes
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoModeIndicator