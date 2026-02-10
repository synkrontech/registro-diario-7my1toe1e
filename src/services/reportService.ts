import { supabase } from '@/lib/supabase/client'
import { UserProfile, TimeEntry } from '@/lib/types'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'

export const reportService = {
  async getReportUsers(currentUserId: string, currentUserRole: string) {
    if (currentUserRole === 'consultor') {
      // Consultants can only see themselves
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .single()

      if (error) throw error
      return [data] as UserProfile[]
    }

    if (currentUserRole === 'gerente') {
      // Managers see users assigned to their projects
      // First, get projects managed by this user
      const { data: projects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('gerente_id', currentUserId)

      if (projectError) throw projectError

      if (!projects || projects.length === 0) {
        // If no projects managed, return only themselves
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUserId)
          .single()
        if (error) throw error
        return [data] as UserProfile[]
      }

      const projectIds = projects.map((p) => p.id)

      // Get users assigned to these projects
      const { data: assignments, error: assignmentError } = await supabase
        .from('project_assignments')
        .select('user_id')
        .in('project_id', projectIds)

      if (assignmentError) throw assignmentError

      const userIds = [
        ...new Set(assignments.map((a) => a.user_id)),
        currentUserId,
      ] // Include themselves

      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)
        .eq('activo', true)
        .order('nombre')

      if (userError) throw userError
      return users as UserProfile[]
    }

    // Admin/Director see all active users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error
    return users as UserProfile[]
  },

  async getReportData(userId: string, month: number, year: number) {
    const startDate = startOfMonth(new Date(year, month))
    const endDate = endOfMonth(new Date(year, month))

    const { data, error } = await supabase
      .from('time_entries')
      .select(
        `
        *,
        projects (
          nombre,
          clients ( nombre ),
          systems ( nombre )
        )
      `,
      )
      .eq('user_id', userId)
      .gte('fecha', format(startDate, 'yyyy-MM-dd'))
      .lte('fecha', format(endDate, 'yyyy-MM-dd'))
      .order('fecha', { ascending: true })

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
    })) as TimeEntry[]
  },

  async getProjectReportData(
    projectId: string,
    startDate: Date,
    endDate: Date,
  ) {
    // Fetch Project Details with metadata
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(
        `
        *,
        clients ( nombre ),
        systems ( nombre ),
        users ( nombre, apellido )
      `,
      )
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    // Fetch Time Entries for the project, approved only
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select(
        `
        *,
        users ( nombre, apellido, email )
      `,
      )
      .eq('project_id', projectId)
      .eq('status', 'aprobado')
      .gte('fecha', format(startDate, 'yyyy-MM-dd'))
      .lte('fecha', format(endDate, 'yyyy-MM-dd'))
      .order('fecha', { ascending: true })

    if (entriesError) throw entriesError

    return { project, entries }
  },
}
