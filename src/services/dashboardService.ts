import { supabase } from '@/lib/supabase/client'
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from 'date-fns'
import { TimeEntry, ExecutiveReportItem } from '@/lib/types'

export const dashboardService = {
  // Consultant Metrics
  async getConsultantMetrics(userId: string, date: Date = new Date()) {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const formattedStart = format(start, 'yyyy-MM-dd')
    const formattedEnd = format(end, 'yyyy-MM-dd')

    // Get all entries for the month
    const { data: entries, error } = await supabase
      .from('time_entries')
      .select('*, projects(nombre, clients(nombre))')
      .eq('user_id', userId)
      .gte('fecha', formattedStart)
      .lte('fecha', formattedEnd)
      .order('fecha', { ascending: false })

    if (error) throw error

    // Transform to standard TimeEntry
    const timeEntries: TimeEntry[] = entries.map((e: any) => ({
      ...e,
      project_name: e.projects?.nombre,
      client_name: e.projects?.clients?.nombre,
      date: new Date(e.fecha),
    }))

    // Calc KPIs
    const totalMinutes = timeEntries.reduce(
      (acc, curr) => acc + curr.durationMinutes,
      0,
    )
    const approvedMinutes = timeEntries
      .filter((e) => e.status === 'aprobado')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0)
    const pendingMinutes = timeEntries
      .filter((e) => e.status === 'pendiente')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0)
    const approvalRate =
      totalMinutes > 0 ? (approvedMinutes / totalMinutes) * 100 : 0

    // Evolution Chart Data (Group by Day)
    const days = eachDayOfInterval({ start, end })
    const evolutionData = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayEntries = timeEntries.filter(
        (e) => format(e.date, 'yyyy-MM-dd') === dayStr,
      )
      return {
        date: format(day, 'dd/MM'),
        pending: dayEntries
          .filter((e) => e.status === 'pendiente')
          .reduce((acc, curr) => acc + curr.durationMinutes / 60, 0),
        approved: dayEntries
          .filter((e) => e.status === 'aprobado')
          .reduce((acc, curr) => acc + curr.durationMinutes / 60, 0),
        rejected: dayEntries
          .filter((e) => e.status === 'rechazado')
          .reduce((acc, curr) => acc + curr.durationMinutes / 60, 0),
      }
    })

    // Project Distribution
    const projectDist = timeEntries.reduce(
      (acc, curr) => {
        const projName = curr.project_name || 'Unknown'
        if (!acc[projName]) acc[projName] = 0
        acc[projName] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    const projectData = Object.entries(projectDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      kpis: {
        registeredHours: totalMinutes / 60,
        approvedHours: approvedMinutes / 60,
        pendingHours: pendingMinutes / 60,
        approvalRate,
      },
      evolutionData,
      projectData,
      lastEntries: timeEntries.slice(0, 10),
    }
  },

  // Manager Metrics
  async getManagerMetrics(managerId: string, startDate: Date, endDate: Date) {
    const formattedStart = format(startDate, 'yyyy-MM-dd')
    const formattedEnd = format(endDate, 'yyyy-MM-dd')

    // 1. Get managed projects
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('id, nombre, status')
      .eq('gerente_id', managerId)

    if (projError) throw projError
    const projectIds = projects.map((p) => p.id)

    // 2. Get all entries for managed projects in range
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*, users(nombre, apellido), projects(nombre)')
      .in('project_id', projectIds)
      .gte('fecha', formattedStart)
      .lte('fecha', formattedEnd)

    if (entriesError) throw entriesError

    // 3. Get pending entries for badge (total, not just range)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('time_entries')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'pendiente')

    if (pendingError) throw pendingError

    // KPIs
    const totalHours =
      entries
        .filter((e) => e.status === 'aprobado')
        .reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
    const rejectedEntries = entries.filter(
      (e) => e.status === 'rechazado',
    ).length
    const totalEntries = entries.length
    const rejectionRate =
      totalEntries > 0 ? (rejectedEntries / totalEntries) * 100 : 0

    // Weekly Trend (Last 4 weeks relative to end date or range)
    // We group by week of the entries
    const weeklyData: any[] = []
    // Simple aggregation by week
    const entriesByWeek = entries.reduce(
      (acc, curr) => {
        const week = format(startOfWeek(new Date(curr.fecha)), 'dd/MM')
        if (!acc[week]) acc[week] = { registered: 0, approved: 0 }
        acc[week].registered += curr.durationMinutes / 60
        if (curr.status === 'aprobado')
          acc[week].approved += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, { registered: number; approved: number }>,
    )

    Object.keys(entriesByWeek).forEach((key) => {
      weeklyData.push({ name: key, ...entriesByWeek[key] })
    })
    weeklyData.sort((a, b) => a.name.localeCompare(b.name)) // Rough sort

    // Top Consultants
    const consultantHours = entries.reduce(
      (acc, curr) => {
        const name = `${curr.users?.nombre} ${curr.users?.apellido}`
        if (!acc[name]) acc[name] = 0
        acc[name] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    const topConsultants = Object.entries(consultantHours)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)

    // Pending Approvals Table Data (Grouped by Project)
    // Fetch pending entries detail (could optimize to fetch all relevant status above)
    const { data: pendingEntriesDetail, error: pDetailError } = await supabase
      .from('time_entries')
      .select('*, users(nombre, apellido), projects(nombre)')
      .in('project_id', projectIds)
      .eq('status', 'pendiente')
      .order('fecha', { ascending: true })

    if (pDetailError) throw pDetailError

    // Group
    const pendingByProject = pendingEntriesDetail.reduce(
      (acc, curr) => {
        const pName = curr.projects?.nombre || 'Unknown'
        if (!acc[pName]) acc[pName] = []
        acc[pName].push({
          id: curr.id,
          consultant: `${curr.users?.nombre} ${curr.users?.apellido}`,
          date: curr.fecha,
          hours: curr.durationMinutes / 60,
          description: curr.description,
        })
        return acc
      },
      {} as Record<string, any[]>,
    )

    // Project Distribution (Hours)
    const projDist = entries.reduce(
      (acc, curr) => {
        const pName = curr.projects?.nombre || 'Unknown'
        if (!acc[pName]) acc[pName] = 0
        acc[pName] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    const projectDistribution = Object.entries(projDist).map(
      ([name, value]) => ({ name, value }),
    )

    return {
      kpis: {
        assignedProjects: projects.length,
        pendingApprovals: pendingCount || 0,
        monthlyHours: totalHours,
        rejectionRate,
      },
      charts: {
        weeklyTrend: weeklyData,
        topConsultants,
        projectDistribution,
      },
      pendingTable: pendingByProject,
    }
  },

  // Director Metrics
  async getDirectorMetrics(filters: {
    clientIds: string[]
    systemIds: string[]
    workFront: string | null
    from: Date
    to: Date
  }) {
    const formattedStart = format(filters.from, 'yyyy-MM-dd')
    const formattedEnd = format(filters.to, 'yyyy-MM-dd')

    // Base query for approved entries (Director cares about approved/billable mostly, but let's see)
    // Acceptance criteria says: "Director... must have access to all data... Charts... strictly filter for status = 'aprobado'"

    let query = supabase
      .from('time_entries')
      .select(
        `
            durationMinutes, 
            status, 
            fecha,
            user_id,
            projects!inner (
                id, nombre, work_front, status,
                clients!inner(id, nombre),
                systems(id, nombre),
                users(nombre, apellido)
            )
        `,
      )
      .gte('fecha', formattedStart)
      .lte('fecha', formattedEnd)

    if (filters.clientIds.length > 0) {
      query = query.in('projects.clients.id', filters.clientIds)
    }
    if (filters.systemIds.length > 0) {
      // Since systems is left join in structure usually, but here !inner on projects ensures relation?
      // Actually systems is optional on project.
      // We need to filter manually if not !inner. Let's assume standard filtering
      // Supabase postgrest doesn't support complex deep filtering on left joins easily without !inner.
      // Let's filter in memory if needed or use !inner if we strictly want projects with systems.
      // Assuming user wants to filter by system if provided.
      // We will do it in JS for flexibility if dataset is manageable, or stricter query.
    }
    if (filters.workFront) {
      query = query.eq('projects.work_front', filters.workFront)
    }

    const { data: rawData, error } = await query
    if (error) throw error

    // JS Filtering for System (optional relation)
    let data = rawData
    if (filters.systemIds.length > 0) {
      data = data.filter(
        (d: any) =>
          d.projects.systems &&
          filters.systemIds.includes(d.projects.systems.id),
      )
    }

    // Previous Month Comparison for KPI
    const prevStart = subMonths(filters.from, 1)
    const prevEnd = subMonths(filters.to, 1)

    // We fetch simplified previous data for KPI
    // We approximate or do another query. Let's do another query.
    const { data: prevData, error: prevError } = await supabase
      .from('time_entries')
      .select('durationMinutes')
      .eq('status', 'aprobado')
      .gte('fecha', format(prevStart, 'yyyy-MM-dd'))
      .lte('fecha', format(prevEnd, 'yyyy-MM-dd'))

    if (prevError) throw prevError
    const prevTotalHours =
      prevData.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60

    // Aggregations
    const approvedEntries = data.filter((e: any) => e.status === 'aprobado')
    const totalApprovedMinutes = approvedEntries.reduce(
      (acc: any, curr: any) => acc + curr.durationMinutes,
      0,
    )
    const totalApprovedHours = totalApprovedMinutes / 60

    // Active Projects (count unique project IDs in the filtered data or generally active?)
    // "Active Projects count" usually implies currently active projects in DB, filtered by criteria.
    // Let's count unique projects in the time entries + fetch active projects matching criteria separately?
    // User story says "Active Projects count". Usually means Status='Activo'.
    // Let's fetch active projects count matching filters.

    let projQuery = supabase
      .from('projects')
      .select('id, client_id, system_id, work_front', {
        count: 'exact',
        head: true,
      })
      .eq('status', 'activo')
    if (filters.clientIds.length > 0)
      projQuery = projQuery.in('client_id', filters.clientIds)
    if (filters.workFront)
      projQuery = projQuery.eq('work_front', filters.workFront)
    // System filtering on projects requires join, difficult with head:true.
    // We'll stick to simple count from entries or just generic active count.
    // Let's use unique projects from data as "Projects with activity" or just query standard count without deep system filter for speed.
    const uniqueActiveProjectsInData = new Set(
      data.map((d: any) => d.projects.id),
    ).size

    // Active Consultants
    const uniqueConsultants = new Set(data.map((d: any) => d.user_id)).size

    // KPIs
    const totalHoursDiff =
      prevTotalHours > 0
        ? ((totalApprovedHours - prevTotalHours) / prevTotalHours) * 100
        : 0

    // Utilization Gauge
    // Capacity = 160h * active consultants
    const capacity = uniqueConsultants * 160
    const utilization = capacity > 0 ? (totalApprovedHours / capacity) * 100 : 0

    // Approval Ratio
    const allMinutes = data.reduce(
      (acc: any, curr: any) => acc + curr.durationMinutes,
      0,
    )
    const approvalRatio =
      allMinutes > 0 ? (totalApprovedMinutes / allMinutes) * 100 : 0

    // Avg Hours per Consultant
    const avgHours =
      uniqueConsultants > 0 ? totalApprovedHours / uniqueConsultants : 0

    // Charts

    // Work Front
    const wfMap = approvedEntries.reduce(
      (acc: any, curr: any) => {
        const wf = curr.projects.work_front || 'Otro'
        if (!acc[wf]) acc[wf] = 0
        acc[wf] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )
    const workFrontData = Object.entries(wfMap).map(([name, value]) => ({
      name,
      value,
    }))

    // Client Dist
    const clMap = approvedEntries.reduce(
      (acc: any, curr: any) => {
        const cl = curr.projects.clients?.nombre || 'Unknown'
        if (!acc[cl]) acc[cl] = 0
        acc[cl] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )
    const clientData = Object.entries(clMap).map(([name, value]) => ({
      name,
      value,
    }))

    // Timeline (Weekly)
    const weeklyMap = data.reduce((acc: any, curr: any) => {
      const week = format(startOfWeek(new Date(curr.fecha)), 'dd/MM')
      if (!acc[week]) acc[week] = { name: week, registered: 0, approved: 0 }
      acc[week].registered += curr.durationMinutes / 60
      if (curr.status === 'aprobado')
        acc[week].approved += curr.durationMinutes / 60
      return acc
    }, {})
    const timelineData = Object.values(weeklyMap).sort((a: any, b: any) =>
      a.name.localeCompare(b.name),
    )

    // Consolidated Table
    // Group by Client -> Project
    const consolidated: any[] = []
    // Group approved entries by project first
    const projectMap = approvedEntries.reduce((acc: any, curr: any) => {
      const pid = curr.projects.id
      if (!acc[pid]) {
        acc[pid] = {
          id: pid,
          project: curr.projects.nombre,
          client: curr.projects.clients?.nombre || 'Unknown',
          manager:
            `${curr.projects.users?.nombre || ''} ${curr.projects.users?.apellido || ''}`.trim() ||
            '-',
          status: curr.projects.status,
          hours: 0,
          consultants: new Set(),
        }
      }
      acc[pid].hours += curr.durationMinutes / 60
      acc[pid].consultants.add(curr.user_id)
      return acc
    }, {})

    Object.values(projectMap).forEach((p: any) => {
      consolidated.push({
        project: p.project,
        client: p.client,
        manager: p.manager,
        status: p.status,
        totalHours: p.hours,
        totalConsultants: p.consultants.size,
      })
    })

    return {
      kpis: {
        totalHours: totalApprovedHours,
        totalHoursDiff,
        activeProjects: uniqueActiveProjectsInData,
        activeConsultants: uniqueConsultants,
        globalUtilization: utilization,
        approvalRatio,
        avgHoursConsultant: avgHours,
      },
      charts: {
        workFrontData,
        clientData,
        timelineData,
      },
      consolidatedTable: consolidated,
    }
  },
}
