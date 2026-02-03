/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    './index.html', 
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/utils/**/*.{js,ts}',
    './src/services/**/*.{js,ts}',
    './src/types/**/*.{js,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    // Background colors
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700',
    'bg-pink-50', 'bg-pink-100', 'bg-pink-500', 'bg-pink-600', 'bg-pink-700',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600', 'bg-red-700',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700',
    'bg-cyan-50', 'bg-cyan-100', 'bg-cyan-500', 'bg-cyan-600', 'bg-cyan-700',
    'bg-emerald-50', 'bg-emerald-100', 'bg-emerald-500', 'bg-emerald-600', 'bg-emerald-700',
    'bg-teal-50', 'bg-teal-100', 'bg-teal-500', 'bg-teal-600', 'bg-teal-700',
    'bg-lime-50', 'bg-lime-100', 'bg-lime-500', 'bg-lime-600', 'bg-lime-700',
    
    // Text colors
    'text-blue-600', 'text-blue-700', 'text-blue-800',
    'text-green-600', 'text-green-700', 'text-green-800',
    'text-purple-600', 'text-purple-700', 'text-purple-800',
    'text-pink-600', 'text-pink-700', 'text-pink-800',
    'text-indigo-600', 'text-indigo-700', 'text-indigo-800',
    'text-orange-600', 'text-orange-700', 'text-orange-800',
    'text-red-600', 'text-red-700', 'text-red-800',
    'text-gray-600', 'text-gray-700', 'text-gray-800',
    'text-cyan-600', 'text-cyan-700', 'text-cyan-800',
    'text-emerald-600', 'text-emerald-700', 'text-emerald-800',
    'text-teal-600', 'text-teal-700', 'text-teal-800',
    'text-lime-600', 'text-lime-700', 'text-lime-800',
    
    // Border colors
    'border-blue-200', 'border-green-200', 'border-purple-200', 'border-pink-200', 
    'border-indigo-200', 'border-orange-200', 'border-red-200', 'border-gray-200', 
    'border-cyan-200', 'border-emerald-200', 'border-teal-200', 'border-lime-200',
    
    // Hover states
    'hover:bg-blue-50', 'hover:bg-blue-700', 'hover:bg-green-700', 'hover:bg-purple-700',
    'hover:bg-pink-700', 'hover:bg-indigo-700', 'hover:bg-orange-700', 'hover:bg-red-700',
    'hover:bg-gray-50', 'hover:bg-gray-700', 'hover:bg-cyan-50', 'hover:bg-cyan-700',
    'hover:bg-emerald-50', 'hover:bg-emerald-700', 'hover:bg-teal-50', 'hover:bg-teal-700',
    'hover:bg-lime-50', 'hover:bg-lime-700',
    
    // Hover text colors
    'hover:text-blue-700', 'hover:text-green-700', 'hover:text-purple-700',
    'hover:text-pink-700', 'hover:text-indigo-700', 'hover:text-orange-700',
    'hover:text-red-700', 'hover:text-gray-700', 'hover:text-cyan-700',
    'hover:text-emerald-700', 'hover:text-teal-700', 'hover:text-lime-700'
  ]
}