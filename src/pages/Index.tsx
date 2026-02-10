import { useAuth } from '@/components/AuthProvider'
import { ConsultantDashboard } from '@/components/dashboards/ConsultantDashboard'
import { ManagerDashboard } from '@/components/dashboards/ManagerDashboard'
import { DirectorDashboard } from '@/components/dashboards/DirectorDashboard'
import { Loader2 } from 'lucide-react'

const Index = () => {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  // Role Based Rendering
  if (profile?.role === 'consultor') {
    return <ConsultantDashboard />
  }

  if (profile?.role === 'gerente') {
    return <ManagerDashboard />
  }

  if (profile?.role === 'admin' || profile?.role === 'director') {
    return <DirectorDashboard />
  }

  // Fallback
  return <ConsultantDashboard />
}

export default Index
