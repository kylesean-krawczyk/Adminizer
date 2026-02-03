// Tailwind CSS color mapping to hex values
export const tailwindColors = {
  // Blue colors
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  
  // Green colors
  'green-50': '#f0fdf4',
  'green-100': '#dcfce7',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'green-700': '#15803d',
  
  // Purple colors
  'purple-50': '#faf5ff',
  'purple-100': '#f3e8ff',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'purple-700': '#7e22ce',
  
  // Pink colors
  'pink-50': '#fdf2f8',
  'pink-100': '#fce7f3',
  'pink-500': '#ec4899',
  'pink-600': '#db2777',
  'pink-700': '#be185d',
  
  // Indigo colors
  'indigo-50': '#eef2ff',
  'indigo-100': '#e0e7ff',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  
  // Orange colors
  'orange-50': '#fff7ed',
  'orange-100': '#ffedd5',
  'orange-500': '#f97316',
  'orange-600': '#ea580c',
  'orange-700': '#c2410c',
  
  // Red colors
  'red-50': '#fef2f2',
  'red-100': '#fee2e2',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'red-700': '#b91c1c',
  
  // Gray colors
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  
  // Cyan colors
  'cyan-50': '#ecfeff',
  'cyan-100': '#cffafe',
  'cyan-500': '#06b6d4',
  'cyan-600': '#0891b2',
  'cyan-700': '#0e7490',
  
  // Emerald colors
  'emerald-50': '#ecfdf5',
  'emerald-100': '#d1fae5',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'emerald-700': '#047857'
}

export function getHexColor(tailwindClass: string): string {
  return tailwindColors[tailwindClass as keyof typeof tailwindColors] || '#6b7280'
}

export function extractColorFromClass(className: string): string {
  // Extract color from classes like 'bg-blue-50' or 'text-blue-600'
  const match = className.match(/(blue|green|purple|pink|indigo|orange|red|gray|cyan|emerald)-(50|100|500|600|700)/)
  if (match) {
    const colorKey = `${match[1]}-${match[2]}` as keyof typeof tailwindColors
    return tailwindColors[colorKey] || '#6b7280'
  }
  return '#6b7280'
}