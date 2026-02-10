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
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import PendingApproval from './pages/PendingApproval'
import UserManagement from './pages/admin/UserManagement'
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
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
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
