import { supabase } from '@/lib/supabase/client'
import {
  ApprovalFiltersState,
  ApprovalTimeEntry,
  TimeEntryStatus,
} from '@/lib/types'
import { parseISO } from 'date-fns'

export const approvalService = {
  async getPendingEntries(
    userId: string,
    role: string,
    filters?: ApprovalFiltersState,
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
          clients!inner ( id, nombre ),
          systems ( nombre )
        ),
        users:users!time_entries_user_id_fkey!inner (
          id,
          nombre,
          apellido,
          email
        )
      `,
      )
      .eq('status', 'pendiente')

    // Role Based Access
    if (role === 'gerente') {
      query = query.eq('projects.gerente_id', userId)
    }

    // Apply Filters
    if (filters) {
      if (filters.clientId) {
        query = query.eq('projects.clients.id', filters.clientId)
      }
      if (filters.consultantId) {
        query = query.eq('user_id', filters.consultantId)
      }
      if (filters.dateRange?.from) {
        query = query.gte('fecha', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange?.to) {
        query = query.lte('fecha', filters.dateRange.to.toISOString())
      }
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

  async getHistoryEntries(
    userId: string,
    role: string,
    filters: ApprovalFiltersState,
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
          clients!inner ( id, nombre ),
          systems ( nombre )
        ),
        users:users!time_entries_user_id_fkey!inner (
          id,
          nombre,
          apellido,
          email
        ),
        processor:users!time_entries_processed_by_fkey (
          nombre,
          apellido
        )
      `,
      )
      .neq('status', 'pendiente')
      .order('processed_at', { ascending: false })

    // Role Based Access
    if (role === 'gerente') {
      query = query.eq('projects.gerente_id', userId)
    }

    // Apply Filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.clientId) {
      query = query.eq('projects.clients.id', filters.clientId)
    }
    if (filters.consultantId) {
      query = query.eq('user_id', filters.consultantId)
    }
    if (filters.dateRange?.from) {
      query = query.gte('fecha', filters.dateRange.from.toISOString())
    }
    if (filters.dateRange?.to) {
      query = query.lte('fecha', filters.dateRange.to.toISOString())
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
      processed_by_name: item.processor
        ? `${item.processor.nombre} ${item.processor.apellido}`
        : undefined,
      processed_at: item.processed_at,
    }))
  },

  async updateEntryStatus(
    ids: string[],
    status: TimeEntryStatus,
    adminId: string,
  ) {
    // 1. Fetch entries to know the consultant (target_user_id) for audit logging
    const { data: entries, error: fetchError } = await supabase
      .from('time_entries')
      .select('id, user_id, status')
      .in('id', ids)

    if (fetchError) throw fetchError

    const now = new Date().toISOString()

    // 2. Update entries in database
    const { error } = await supabase
      .from('time_entries')
      .update({
        status,
        processed_by: adminId,
        processed_at: now,
      })
      .in('id', ids)

    if (error) throw error

    // 3. Create Audit Logs
    // Group by user to minimize inserts if needed, but per requirement we want clear logs.
    // We will insert one log per entry to keep full traceability of each specific record change.
    const auditLogs = entries.map((entry) => ({
      admin_id: adminId,
      action_type: status === 'aprobado' ? 'approval' : 'rejection',
      target_user_id: entry.user_id,
      details: {
        time_entry_id: entry.id,
        previous_status: entry.status,
        new_status: status,
      },
    }))

    if (auditLogs.length > 0) {
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert(auditLogs)
      if (auditError) {
        console.error('Failed to create audit logs', auditError)
        // Non-blocking error
      }
    }
  },

  async getPendingCount(userId: string, role: string): Promise<number> {
    let query = supabase
      .from('time_entries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pendiente')

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
