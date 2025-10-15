// Version management system for Adminizer
export const APP_VERSION = '2.1.0'

export const VERSION_HISTORY = [
  {
    version: '2.1.0',
    date: '2024-01-20',
    changes: [
      'Rebranded from Adminezer to Adminizer with custom eye icon',
      'Added version indicator system',
      'Restructured dashboard with department-based access',
      'Created Operations Center for business operations',
      'Added department-specific pages and access control'
    ]
  },
  {
    version: '2.0.0',
    date: '2024-01-15',
    changes: [
      'Major dashboard restructure',
      'Added business departments',
      'Moved operations to dedicated section',
      'Enhanced user access management'
    ]
  },
  {
    version: '1.0.0',
    date: '2024-01-01',
    changes: [
      'Initial release',
      'Document management system',
      'Multi-tenant architecture',
      'OAuth integrations',
      'Role-based access control'
    ]
  }
]

export const getVersionInfo = () => ({
  version: APP_VERSION,
  buildDate: new Date().toISOString(),
  environment: import.meta.env.VITE_DEMO_MODE === 'true' ? 'demo' : 'production'
})

// Function to increment version (for development use)
export const incrementVersion = (type: 'major' | 'minor' | 'patch' = 'patch') => {
  const [major, minor, patch] = APP_VERSION.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      return APP_VERSION
  }
}