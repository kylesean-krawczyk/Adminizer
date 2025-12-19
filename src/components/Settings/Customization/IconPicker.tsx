import React, { useState, useMemo } from 'react'
import { IconName } from '../../../types/departmentLandingPage'
import * as Icons from 'lucide-react'
import { Search, X } from 'lucide-react'

const AVAILABLE_ICONS: IconName[] = [
  'FileText', 'Users', 'Settings', 'Plus', 'Heart', 'Calendar', 'Clock',
  'TrendingUp', 'BarChart', 'PieChart', 'Activity', 'Award', 'Briefcase',
  'Building', 'Building2', 'Calculator', 'CheckCircle', 'Clipboard', 'Cog',
  'DollarSign', 'Download', 'Edit', 'Eye', 'Folder', 'Gift', 'Globe',
  'Headphones', 'Home', 'Inbox', 'Mail', 'MapPin', 'Megaphone', 'MessageCircle',
  'Monitor', 'Package', 'Palette', 'Phone', 'Play', 'Printer', 'Save',
  'Search', 'Share', 'Shield', 'ShoppingCart', 'Star', 'Tag', 'Target',
  'ThumbsUp', 'TrendingDown', 'Upload', 'Video', 'Zap', 'Wrench'
]

interface IconPickerProps {
  selectedIcon: IconName
  onSelect: (icon: IconName) => void
  onClose?: () => void
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredIcons = useMemo(() => {
    if (!searchTerm) return AVAILABLE_ICONS
    const term = searchTerm.toLowerCase()
    return AVAILABLE_ICONS.filter(icon => icon.toLowerCase().includes(term))
  }, [searchTerm])

  const handleIconSelect = (icon: IconName) => {
    onSelect(icon)
    if (onClose) onClose()
  }

  const getIconComponent = (iconName: IconName) => {
    const IconComponent = (Icons as any)[iconName]
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-96">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Select Icon</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search icons..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {filteredIcons.map((icon) => (
          <button
            key={icon}
            onClick={() => handleIconSelect(icon)}
            className={`p-3 rounded-lg border-2 transition-all hover:bg-blue-50 hover:border-blue-300 ${
              selectedIcon === icon
                ? 'bg-blue-100 border-blue-500'
                : 'bg-white border-gray-200'
            }`}
            title={icon}
          >
            {getIconComponent(icon)}
          </button>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-8">
          No icons found matching "{searchTerm}"
        </div>
      )}
    </div>
  )
}
