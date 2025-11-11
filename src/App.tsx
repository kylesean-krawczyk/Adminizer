import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DemoAuthProvider } from './contexts/DemoAuthContext'
import { VerticalProvider } from './contexts/VerticalContext'
import { FeatureFlagProvider } from './contexts/FeatureFlagContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { PageContextProvider } from './contexts/PageContextContext'
import { isDemoMode } from './lib/demo'
import AuthGuard from './components/Auth/AuthGuard'
import Dashboard from './components/Dashboard'
import DocumentList from './components/DocumentList'
import DocumentUpload from './components/DocumentUpload'
import Navigation from './components/Navigation'
import CollapsibleSidebar from './components/Navigation/CollapsibleSidebar'
import OperationsPage from './components/Operations/OperationsPage'
import OperationsLandingPage from './components/Operations/OperationsLandingPage'
import DepartmentPage from './components/Departments/DepartmentPage'
import SalesDepartmentPage from './components/Departments/SalesDepartmentPage'
import UserManagementPage from './components/UserManagement/UserManagementPage'
import InviteAcceptPage from './components/UserManagement/InviteAcceptPage'
import OAuthCallbackPage from './components/OAuth/OAuthCallbackPage'
import OAuthConnectionManager from './components/OAuth/OAuthConnectionManager'
import DemoModeIndicator from './components/Demo/DemoModeIndicator'
import DevVerticalSwitcher from './components/Dev/DevVerticalSwitcher'
import VerticalKeyboardShortcuts from './components/Dev/VerticalKeyboardShortcuts'
import FeatureFlagsSettings from './components/Settings/FeatureFlagsSettings'
import ThemePreview from './components/Settings/ThemePreview'
import NotificationPreferencesPage from './components/Settings/NotificationPreferencesPage'
import VerticalConfigurationSettings from './components/Settings/VerticalConfigurationSettings'
import ChatWidget from './components/Chat/ChatWidget'
import ToolRegistryPanel from './components/Dev/ToolRegistryPanel'
import ToolExecutionLogs from './components/Dev/ToolExecutionLogs'
import WorkflowListPage from './components/Workflows/WorkflowListPage'
import WorkflowInstanceViewer from './components/Workflows/WorkflowInstanceViewer'

function App() {
  const AuthContextProvider = isDemoMode ? DemoAuthProvider : AuthProvider

  return (
    <VerticalProvider>
      <ThemeProvider>
        <AuthContextProvider>
          <FeatureFlagProvider>
            <Router>
              <PageContextProvider>
          <DemoModeIndicator />
          <DevVerticalSwitcher />
          <VerticalKeyboardShortcuts />
          <Routes>
            {/* Public routes */}
            <Route path="/invite/:token" element={<InviteAcceptPage />} />
            <Route path="/oauth/callback/:provider" element={<OAuthCallbackPage />} />

            {/* Protected routes */}
            <Route path="/*" element={
              <AuthGuard>
                <div className={`min-h-screen bg-white ${isDemoMode || import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV ? 'pt-10' : ''}`}>
                  <Navigation />
                  <div className="flex h-screen">
                    <CollapsibleSidebar />
                    <main className="flex-1 overflow-y-auto bg-white p-8 transition-all duration-300">
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/documents" element={<DocumentList />} />
                        <Route path="/upload" element={<DocumentUpload />} />
                        <Route path="/operations" element={<OperationsLandingPage />} />
                        <Route path="/operations/:category" element={<OperationsPage />} />
                        <Route path="/department/:department" element={<DepartmentPage />} />
                        <Route path="/department/sales" element={<SalesDepartmentPage />} />
                        <Route path="/users" element={<UserManagementPage />} />
                        <Route path="/oauth" element={<OAuthConnectionManager />} />
                        <Route path="/settings/features" element={<FeatureFlagsSettings />} />
                        <Route path="/settings/theme" element={<ThemePreview />} />
                        <Route path="/settings/notifications" element={<NotificationPreferencesPage />} />
                        <Route path="/settings/vertical" element={<VerticalConfigurationSettings />} />
                        <Route path="/dev/tool-registry" element={<ToolRegistryPanel />} />
                        <Route path="/dev/tool-logs" element={<ToolExecutionLogs />} />
                        <Route path="/workflows" element={<WorkflowListPage />} />
                        <Route path="/workflows/instance/:instanceId" element={<WorkflowInstanceViewer />} />
                      </Routes>
                    </main>
                  </div>
                  <ChatWidget />
                </div>
              </AuthGuard>
            } />
          </Routes>
              </PageContextProvider>
            </Router>
          </FeatureFlagProvider>
        </AuthContextProvider>
      </ThemeProvider>
    </VerticalProvider>
  )
}

export default App