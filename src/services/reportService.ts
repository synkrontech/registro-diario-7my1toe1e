import { supabase } from '@/lib/supabase/client'
import {
  UserProfile,
  TimeEntry,
  ManagerProjectStat,
  ExecutiveReportItem,
} from '@/lib/types'
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
      durationMinutes: item.durationminutes, // Corrected casing from Supabase return
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
    // Explicitly use time_entries_user_id_fkey to avoid ambiguity with processed_by
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select(
        `
        *,
        users!time_entries_user_id_fkey ( nombre, apellido, email )
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

  async getManagerReportData(managerId: string, month: number, year: number) {
    const startDate = startOfMonth(new Date(year, month))
    const endDate = endOfMonth(new Date(year, month))

    // 1. Get projects managed by managerId
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*, clients(nombre), systems(nombre)')
      .eq('gerente_id', managerId)

    if (projectsError) throw projectsError

    const projectIds = projects.map((p) => p.id)

    if (projectIds.length === 0) {
      return {
        projects: [],
        stats: {
          activeProjects: 0,
          totalApprovedHours: 0,
          avgHoursPerProject: 0,
        },
      }
    }

    // 2. Get time entries for these projects in range
    // Explicitly use time_entries_user_id_fkey to avoid ambiguity
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*, users!time_entries_user_id_fkey(id)')
      .in('project_id', projectIds)
      .gte('fecha', format(startDate, 'yyyy-MM-dd'))
      .lte('fecha', format(endDate, 'yyyy-MM-dd'))

    if (entriesError) throw entriesError

    // 3. Process data
    const projectStats: ManagerProjectStat[] = projects.map((project: any) => {
      const projectEntries = entries.filter((e) => e.project_id === project.id)
      const approvedEntries = projectEntries.filter(
        (e) => e.status === 'aprobado',
      )
      const pendingEntries = projectEntries.filter(
        (e) => e.status === 'pendiente',
      )

      const approvedMinutes = approvedEntries.reduce(
        (sum, e) => sum + e.durationminutes,
        0,
      )
      const uniqueConsultants = new Set(projectEntries.map((e) => e.user_id))
        .size

      return {
        ...project,
        client_name: project.clients?.nombre || '-',
        system_name: project.systems?.nombre || '-',
        approvedHours: approvedMinutes / 60,
        pendingCount: pendingEntries.length,
        consultantCount: uniqueConsultants,
      }
    })

    const activeProjectsCount = projects.filter(
      (p) => p.status === 'activo',
    ).length
    const totalApprovedHours = projectStats.reduce(
      (sum, p) => sum + p.approvedHours,
      0,
    )

    return {
      projects: projectStats,
      stats: {
        activeProjects: activeProjectsCount,
        totalApprovedHours,
        avgHoursPerProject:
          activeProjectsCount > 0
            ? totalApprovedHours / activeProjectsCount
            : 0,
      },
    }
  },

  async getExecutiveReportData(filters: {
    clientIds?: string[]
    systemIds?: string[]
    workFront?: string | null
    startDate: Date
    endDate: Date
  }) {
    const { clientIds, systemIds, workFront, startDate, endDate } = filters

    // 1. Fetch Projects with metadata
    let query = supabase.from('projects').select(
      `
      *,
      clients ( id, nombre ),
      systems ( id, nombre ),
      users ( nombre, apellido )
    `,
    )

    if (clientIds && clientIds.length > 0) {
      query = query.in('client_id', clientIds)
    }

    if (systemIds && systemIds.length > 0) {
      query = query.in('system_id', systemIds)
    }

    if (workFront) {
      query = query.eq('work_front', workFront)
    }

    const { data: projects, error: projectsError } = await query
    if (projectsError) throw projectsError

    if (!projects || projects.length === 0) {
      return [] as ExecutiveReportItem[]
    }

    // 2. Fetch approved time entries for these projects within date range
    const projectIds = projects.map((p) => p.id)
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('project_id, durationminutes, user_id')
      .in('project_id', projectIds)
      .eq('status', 'aprobado')
      .gte('fecha', format(startDate, 'yyyy-MM-dd'))
      .lte('fecha', format(endDate, 'yyyy-MM-dd'))

    if (entriesError) throw entriesError

    // 3. Aggregate data per project
    const reportData: ExecutiveReportItem[] = projects.map((p: any) => {
      const projectEntries = entries.filter((e) => e.project_id === p.id)
      const totalMinutes = projectEntries.reduce(
        (acc, e) => acc + e.durationminutes,
        0,
      )
      const uniqueConsultants = new Set(projectEntries.map((e) => e.user_id))
        .size

      return {
        projectId: p.id,
        projectName: p.nombre,
        managerName: p.users ? `${p.users.nombre} ${p.users.apellido}` : '-',
        clientId: p.clients?.id || 'unknown',
        clientName: p.clients?.nombre || 'Desconocido',
        systemId: p.systems?.id || 'unknown',
        systemName: p.systems?.nombre || '-',
        workFront: p.work_front || 'Otro',
        status: p.status,
        totalHours: totalMinutes / 60,
        uniqueConsultants,
      }
    })

    return reportData
  },
}
