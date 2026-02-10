import '@/lib/i18n'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import TimeSheet from './pages/TimeSheet'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import PendingApproval from './pages/PendingApproval'
import UserManagement from './pages/admin/UserManagement'
import NotificationsPage from './pages/admin/NotificationsPage'
import EmailSettingsPage from './pages/admin/EmailSettingsPage'
import ClientManagement from './pages/admin/ClientManagement'
import SystemManagement from './pages/admin/SystemManagement'
import ProjectManagement from './pages/admin/ProjectManagement'
import ApprovalPanel from './pages/admin/ApprovalPanel'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Layout from './components/Layout'
import { TimeStoreProvider } from '@/stores/useTimeStore'
import { AuthProvider, useAuth } from '@/components/AuthProvider'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

const ActiveUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (profile && !profile.activo) {
    return <Navigate to="/pending-approval" replace />
  }

  return <>{children}</>
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const RoleRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode
  allowedRoles: string[]
}) => {
  const { profile, loading } = useAuth()

  if (loading) return null

  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <TimeStoreProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/pending-approval"
              element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <ActiveUserRoute>
                    <Layout />
                  </ActiveUserRoute>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/timesheet" element={<TimeSheet />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              {/* Redirect legacy /settings to /profile */}
              <Route
                path="/settings"
                element={<Navigate to="/profile" replace />}
              />

              {/* Admin Routes */}
              <Route
                path="/admin/users"
                element={
                  <RoleRoute allowedRoles={['admin', 'director']}>
                    <UserManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/approvals"
                element={
                  <RoleRoute allowedRoles={['admin', 'director', 'gerente']}>
                    <ApprovalPanel />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <AdminRoute>
                    <NotificationsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/settings/emails"
                element={
                  <AdminRoute>
                    <EmailSettingsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/clients"
                element={
                  <RoleRoute allowedRoles={['admin', 'director']}>
                    <ClientManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/systems"
                element={
                  <RoleRoute allowedRoles={['admin', 'director']}>
                    <SystemManagement />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <RoleRoute allowedRoles={['admin', 'director']}>
                    <ProjectManagement />
                  </RoleRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TimeStoreProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
