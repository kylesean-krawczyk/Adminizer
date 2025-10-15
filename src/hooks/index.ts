import { useDemoDocuments } from './useDemoDocuments'
import { useDemoOAuth } from './useDemoOAuth'
import { useDemoUserManagement } from './useDemoUserManagement'
import { useDocuments as useRealDocuments } from './useRealDocuments'
import { useOAuth as useRealOAuth } from './useRealOAuth'
import { useUserManagement as useRealUserManagement } from './useRealUserManagement'

const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// Conditionally export hooks based on demo mode
export const useDocuments = isDemoMode ? useDemoDocuments : useRealDocuments
export const useOAuth = isDemoMode ? useDemoOAuth : useRealOAuth
export const useUserManagement = isDemoMode ? useDemoUserManagement : useRealUserManagement

// Export the new department settings hook
export { useDepartmentSettings } from './useDepartmentSettings'
export { useVerticalSwitcher } from './useVerticalSwitcher'
export { useTerminology } from './useTerminology'
export { useTheme } from './useTheme'
export { usePermissions } from './usePermissions'