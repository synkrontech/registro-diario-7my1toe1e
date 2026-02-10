import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { UserProfile, UserPermission, UserPreferences } from '@/lib/types'
import { userService } from '@/services/userService'
import { useToast } from '@/hooks/use-toast'
import i18n from '@/lib/i18n'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  preferences: UserPreferences | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
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
        setPreferences(null)
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

        // Fetch User Preferences
        const userPrefs = await userService.getUserPreferences(userId)
        setPreferences(userPrefs)
        if (userPrefs?.idioma) {
          i18n.changeLanguage(userPrefs.idioma)
        }
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
    <AuthContext.Provider
      value={{ user, profile, preferences, loading, signOut }}
    >
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
