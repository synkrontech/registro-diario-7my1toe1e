import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile, UserPermission } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch user with role details and granular permissions
      const { data, error } = await supabase
        .from('users')
        .select(
          `
          *,
          roles (
            id,
            name,
            role_permissions (
              permissions (
                code,
                resource_id,
                resource_type
              )
            )
          )
        `,
        )
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else {
        // Transform the data to match UserProfile interface
        const roleData = data.roles as any
        const permissions: UserPermission[] =
          roleData?.role_permissions?.map((rp: any) => ({
            code: rp.permissions?.code,
            resourceId: rp.permissions?.resource_id,
            resourceType: rp.permissions?.resource_type,
          })) || []

        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          nombre: data.nombre,
          apellido: data.apellido,
          activo: data.activo,
          created_at: data.created_at,
          role: roleData?.name || 'unknown',
          role_id: roleData?.id,
          permissions,
        }

        setProfile(userProfile)
      }
    } catch (err) {
      console.error('Error in profile fetch:', err)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
