import { supabase } from '@/lib/supabase/client'
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import { TimeEntry } from '@/lib/types'

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
    const rejectedMinutes = timeEntries
      .filter((e) => e.status === 'rechazado')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0)

    // Daily Trend (Line Chart)
    const days = eachDayOfInterval({ start, end })
    const dailyTrend = days.map((day) => {
      const dayEntries = timeEntries.filter((e) => isSameDay(e.date, day))
      return {
        date: format(day, 'dd'),
        fullDate: format(day, 'yyyy-MM-dd'),
        hours:
          dayEntries.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60,
      }
    })

    // Last 5 Records (Fetch separately to get truly last 5 regardless of month view, or just slice current?)
    // User story implies "Last 5 records" generally. Let's fetch the absolute last 5.
    const { data: lastEntriesData, error: lastError } = await supabase
      .from('time_entries')
      .select('*, projects(nombre)')
      .eq('user_id', userId)
      .order('fecha', { ascending: false })
      .limit(5)

    if (lastError) throw lastError
    const lastEntries = lastEntriesData.map((e: any) => ({
      ...e,
      project_name: e.projects?.nombre,
      date: new Date(e.fecha),
    }))

    return {
      kpis: {
        registeredHours: totalMinutes / 60,
        approvedHours: approvedMinutes / 60,
        pendingHours: pendingMinutes / 60,
        rejectedHours: rejectedMinutes / 60,
      },
      dailyTrend,
      lastEntries,
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

    if (projectIds.length === 0) {
      return {
        kpis: {
          assignedProjects: 0,
          pendingApprovals: 0,
          monthlyHours: 0,
          totalConsultants: 0,
        },
        topConsultants: [],
        projectDistribution: [],
      }
    }

    // 2. Get all entries for managed projects in range
    const { data: entries, error: entriesError } = await supabase
      .from('time_entries')
      .select('*, users(id, nombre, apellido), projects(id, nombre)')
      .in('project_id', projectIds)
      .gte('fecha', formattedStart)
      .lte('fecha', formattedEnd)

    if (entriesError) throw entriesError

    // 3. Get pending count (Total pending for these projects, not just in range, usually)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('time_entries')
      .select('id', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'pendiente')

    if (pendingError) throw pendingError

    // KPIs
    const totalHours =
      entries.reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60
    const uniqueConsultants = new Set(entries.map((e) => e.user_id)).size

    // Top 5 Consultants
    const consultantStats = entries.reduce(
      (acc, curr) => {
        const uid = curr.user_id
        if (!acc[uid]) {
          acc[uid] = {
            id: uid,
            name: `${curr.users?.nombre} ${curr.users?.apellido}`,
            hours: 0,
            projects: new Set<string>(),
          }
        }
        acc[uid].hours += curr.durationMinutes / 60
        acc[uid].projects.add(curr.projects?.nombre || 'Unknown')
        return acc
      },
      {} as Record<string, any>,
    )

    const topConsultants = Object.values(consultantStats)
      .sort((a: any, b: any) => b.hours - a.hours)
      .slice(0, 5)
      .map((c: any) => ({
        ...c,
        projects: Array.from(c.projects),
        // Calculate percentage relative to the top performer for progress bar
        percentage:
          Object.values(consultantStats).length > 0
            ? (c.hours /
                Math.max(
                  ...Object.values(consultantStats).map((x: any) => x.hours),
                )) *
              100
            : 0,
      }))

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

    const projectDistribution = Object.entries(projDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return {
      kpis: {
        assignedProjects: projects.length,
        pendingApprovals: pendingCount || 0,
        monthlyHours: totalHours,
        totalConsultants: uniqueConsultants,
      },
      topConsultants,
      projectDistribution,
    }
  },

  // Director Metrics
  async getDirectorMetrics(from: Date, to: Date) {
    const formattedStart = format(from, 'yyyy-MM-dd')
    const formattedEnd = format(to, 'yyyy-MM-dd')

    // Fetch all entries for the period
    const { data: entries, error } = await supabase
      .from('time_entries')
      .select(
        `
        durationMinutes, 
        status, 
        user_id,
        projects (
            id, nombre, work_front, status,
            clients ( nombre ),
            systems ( nombre ),
            users ( nombre, apellido )
        )
      `,
      )
      .gte('fecha', formattedStart)
      .lte('fecha', formattedEnd)

    if (error) throw error

    // Fetch active projects count (Global)
    const { count: activeProjectsCount } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'activo')

    // KPIs
    const totalMinutes = entries.reduce(
      (acc, curr) => acc + curr.durationMinutes,
      0,
    )
    const approvedMinutes = entries
      .filter((e) => e.status === 'aprobado')
      .reduce((acc, curr) => acc + curr.durationMinutes, 0, 0)

    // Active consultants in this period (who logged time)
    const activeConsultants = new Set(entries.map((e) => e.user_id)).size

    const approvalRate =
      totalMinutes > 0 ? (approvedMinutes / totalMinutes) * 100 : 0

    const totalHours = totalMinutes / 60

    // Distributions (Based on Approved Hours as per requirements)
    const approvedEntries = entries.filter((e) => e.status === 'aprobado')

    // By Client
    const clientDist = approvedEntries.reduce(
      (acc, curr: any) => {
        const name = curr.projects?.clients?.nombre || 'Unknown'
        if (!acc[name]) acc[name] = 0
        acc[name] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    // By System
    const systemDist = approvedEntries.reduce(
      (acc, curr: any) => {
        const name = curr.projects?.systems?.nombre || 'N/A'
        if (!acc[name]) acc[name] = 0
        acc[name] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    // By Work Front
    const wfDist = approvedEntries.reduce(
      (acc, curr: any) => {
        const name = curr.projects?.work_front || 'Otro'
        if (!acc[name]) acc[name] = 0
        acc[name] += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, number>,
    )

    // Top 10 Projects (By Total Hours - Requirements say "Most Hours", usually implies total activity, but could be approved. Let's use Total Logged for "Most Hours")
    const projectStats = entries.reduce(
      (acc, curr: any) => {
        const pid = curr.projects?.id
        if (!pid) return acc
        if (!acc[pid]) {
          acc[pid] = {
            project: curr.projects?.nombre,
            client: curr.projects?.clients?.nombre || '-',
            manager: curr.projects?.users
              ? `${curr.projects.users.nombre} ${curr.projects.users.apellido}`
              : '-',
            hours: 0,
          }
        }
        acc[pid].hours += curr.durationMinutes / 60
        return acc
      },
      {} as Record<string, any>,
    )

    const topProjects = Object.values(projectStats)
      .sort((a: any, b: any) => b.hours - a.hours)
      .slice(0, 10)

    return {
      kpis: {
        totalMonthlyHours: totalHours,
        totalActiveProjects: activeProjectsCount || 0,
        totalActiveConsultants: activeConsultants,
        approvalRate,
      },
      charts: {
        byClient: Object.entries(clientDist)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        bySystem: Object.entries(systemDist)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        byWorkFront: Object.entries(wfDist)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      },
      topProjects,
    }
  },
}
