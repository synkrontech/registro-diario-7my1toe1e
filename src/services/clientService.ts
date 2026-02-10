import { supabase } from '@/lib/supabase/client'
import { Client, ClientFormValues } from '@/lib/types'

export const clientService = {
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Client[]
  },

  async createClient(client: ClientFormValues) {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async updateClient(id: string, client: ClientFormValues) {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Client
  },

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id)

    if (error) throw error
  },
}
