import { supabase } from '@/lib/supabase/client'
import { UserPreferences } from '@/lib/types'

export const userService = {
  async getUserPreferences(userId: string) {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error)
      return null
    }

    return data as UserPreferences | null
  },

  async updateUserPreferences(
    userId: string,
    preferences: { idioma?: string; timezone?: string },
  ) {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }

    return data as UserPreferences
  },

  async updateUserProfile(
    userId: string,
    data: { nombre: string; apellido: string },
  ) {
    const { error } = await supabase.from('users').update(data).eq('id', userId)

    if (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  },
}
