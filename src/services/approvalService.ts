import { supabase } from '@/lib/supabase/client'
import { ApprovalTimeEntry, TimeEntryStatus } from '@/lib/types'
import { parseISO } from 'date-fns'

export const approvalService = {
  async getPendingEntries(
    userId: string,
    role: string,
  ): Promise<ApprovalTimeEntry[]> {
    let query = supabase
      .from('time_entries')
      .select(
        `
        *,
        projects!inner (
          id,
          nombre,
          gerente_id,
          clients ( nombre ),
          systems ( nombre )
        ),
        users!inner (
          id,
          nombre,
          apellido,
          email
        )
      `,
      )
      .eq('status', 'pendiente')

    // If manager, only show entries for their projects
    if (role === 'gerente') {
      query = query.eq('projects.gerente_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      project_id: item.project_id,
      date: parseISO(item.fecha),
      startTime: item.startTime,
      endTime: item.endTime,
      description: item.description,
      durationMinutes: item.durationMinutes,
      status: item.status,
      project_name: item.projects?.nombre || 'Desconocido',
      client_name: item.projects?.clients?.nombre || '-',
      system_name: item.projects?.systems?.nombre || '-',
      user_name: `${item.users?.nombre} ${item.users?.apellido}`,
      user_email: item.users?.email,
      user_avatar_seed: item.users?.id,
    }))
  },

  async updateEntryStatus(ids: string[], status: TimeEntryStatus) {
    const { error } = await supabase
      .from('time_entries')
      .update({ status })
      .in('id', ids)

    if (error) throw error
  },

  async getPendingCount(userId: string, role: string): Promise<number> {
    let query = supabase
      .from('time_entries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente')

    // Since we need to filter by related project table for managers, we can't use head:true purely on time_entries
    // without the inner join if we want to be precise.
    // However, head: true with inner join works in Supabase.
    if (role === 'gerente') {
      const { count, error } = await supabase
        .from('time_entries')
        .select('*, projects!inner(gerente_id)', { count: 'exact', head: true })
        .eq('status', 'pendiente')
        .eq('projects.gerente_id', userId)

      if (error) throw error
      return count || 0
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  },
}
