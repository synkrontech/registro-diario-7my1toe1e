import { supabase } from '@/lib/supabase/client'
import { System, SystemFormValues } from '@/lib/types'

export const systemService = {
  async getSystems() {
    const { data, error } = await supabase
      .from('systems')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) throw error
    return data as System[]
  },

  async createSystem(system: SystemFormValues) {
    const { data, error } = await supabase
      .from('systems')
      .insert({
        nombre: system.nombre,
        codigo: system.codigo,
        descripcion: system.descripcion || null,
        activo: system.activo,
      })
      .select()
      .single()

    if (error) throw error
    return data as System
  },

  async updateSystem(id: string, system: SystemFormValues) {
    const { data, error } = await supabase
      .from('systems')
      .update({
        nombre: system.nombre,
        codigo: system.codigo,
        descripcion: system.descripcion || null,
        activo: system.activo,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as System
  },

  async deleteSystem(id: string) {
    const { error } = await supabase.from('systems').delete().eq('id', id)

    if (error) throw error
  },
}
