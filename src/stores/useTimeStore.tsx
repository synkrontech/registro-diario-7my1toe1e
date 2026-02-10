import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import {
  TimeEntry,
  TimeEntryFormValues,
  Project,
  TimeEntryStatus,
} from '@/lib/types'
import { isSameDay, isSameMonth, isSameYear, parseISO, format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'

interface TimeState {
  entries: TimeEntry[]
  projects: Project[]
  viewDate: Date
  isLoading: boolean
  isProjectsLoading: boolean
  statusFilter: TimeEntryStatus | 'all'
  setViewDate: (date: Date) => void
  setStatusFilter: (status: TimeEntryStatus | 'all') => void
  addEntry: (entry: TimeEntryFormValues) => Promise<void>
  updateEntry: (id: string, entry: TimeEntryFormValues) => Promise<void>
  getEntriesByDate: (date: Date) => TimeEntry[]
  getEntriesByMonth: (date: Date) => TimeEntry[]
  getTotalHoursToday: () => string
  refreshEntries: () => void
}

const TimeStoreContext = createContext<TimeState | undefined>(undefined)

export const TimeStoreProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [isProjectsLoading, setIsProjectsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TimeEntryStatus | 'all'>(
    'all',
  )

  const fetchProjects = useCallback(async () => {
    if (!user || !profile) return

    setIsProjectsLoading(true)
    try {
      let data: Project[] = []

      // Role-based project selection with robust error handling.
      // We explicitly set { head: false } to ensure GET requests are used, preventing
      // "Unexpected end of JSON input" errors that can occur with implicit HEAD requests.
      if (profile.role === 'consultor') {
        // 1. Get assignments first
        const { data: assignments, error: assignError } = await supabase
          .from('project_assignments')
          .select('project_id', { head: false })
          .eq('user_id', user.id)

        if (assignError) throw assignError

        const projectIds = assignments?.map((a) => a.project_id) || []

        // 2. Get projects if there are assignments
        if (projectIds.length > 0) {
          const { data: res, error } = await supabase
            .from('projects')
            .select('*', { head: false })
            .in('id', projectIds)
            .eq('status', 'activo')
            .order('nombre')

          if (error) throw error
          data = (res as Project[]) || []
        }
      } else if (profile.role === 'gerente') {
        // Managers see projects they manage
        const { data: res, error } = await supabase
          .from('projects')
          .select('*', { head: false })
          .eq('status', 'activo')
          .eq('gerente_id', user.id)
          .order('nombre')

        if (error) throw error
        data = (res as Project[]) || []
      } else {
        // Admin/Director see all active projects
        const { data: res, error } = await supabase
          .from('projects')
          .select('*', { head: false })
          .eq('status', 'activo')
          .order('nombre')

        if (error) throw error
        data = (res as Project[]) || []
      }

      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        title: 'Error al cargar proyectos',
        description: 'No se pudieron cargar los proyectos asignados.',
        variant: 'destructive',
      })
      // Ensure projects is at least an empty array on error
      setProjects([])
    } finally {
      setIsProjectsLoading(false)
    }
  }, [user, profile, toast])

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    const startStr = format(
      new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
      'yyyy-MM-dd',
    )
    const endStr = format(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0),
      'yyyy-MM-dd',
    )

    try {
      // Fetch entries with related Project, Client, and System data
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
        .eq('user_id', user.id)
        .gte('fecha', startStr)
        .lte('fecha', endStr)
        .order('fecha', { ascending: false })

      if (error) throw error

      const formattedEntries: TimeEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        project_id: item.project_id,
        date: parseISO(item.fecha),
        startTime: item.startTime,
        endTime: item.endTime,
        description: item.description,
        durationMinutes: item.durationminutes, // Correctly map from DB column (lowercase)
        status: item.status,
        project_name: item.projects?.nombre || 'Desconocido',
        client_name: item.projects?.clients?.nombre || '-',
        system_name: item.projects?.systems?.nombre || '-',
      }))

      setEntries(formattedEntries)
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast({
        title: 'Error al cargar registros',
        variant: 'destructive',
      })
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }, [user, viewDate, toast])

  useEffect(() => {
    if (user && profile) {
      fetchProjects()
    }
  }, [fetchProjects, user, profile])

  useEffect(() => {
    if (user) {
      fetchEntries()
    }
  }, [fetchEntries, user])

  // Realtime subscription to time_entries updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('time_entries_db_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchEntries()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchEntries])

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return endH * 60 + endM - (startH * 60 + startM)
  }

  const addEntry = async (data: TimeEntryFormValues) => {
    if (!user) return

    const durationMinutes = calculateDuration(data.startTime, data.endTime)
    const formattedDate = format(data.date, 'yyyy-MM-dd')

    try {
      const { error } = await supabase.from('time_entries').insert({
        user_id: user.id,
        project_id: data.projectId,
        fecha: formattedDate,
        startTime: data.startTime,
        endTime: data.endTime,
        description: data.description,
        durationminutes: durationMinutes, // Use lowercase DB column name
        status: 'pendiente',
      })

      if (error) throw error
      fetchEntries()
    } catch (error: any) {
      console.error(error)
      throw new Error(error.message)
    }
  }

  const updateEntry = async (id: string, data: TimeEntryFormValues) => {
    const durationMinutes = calculateDuration(data.startTime, data.endTime)
    const formattedDate = format(data.date, 'yyyy-MM-dd')

    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          project_id: data.projectId,
          fecha: formattedDate,
          startTime: data.startTime,
          endTime: data.endTime,
          description: data.description,
          durationminutes: durationMinutes, // Use lowercase DB column name
        })
        .eq('id', id)

      if (error) throw error
      fetchEntries()
    } catch (error: any) {
      console.error(error)
      throw new Error(error.message)
    }
  }

  const getEntriesByDate = (date: Date) => {
    return entries.filter((entry) => isSameDay(entry.date, date))
  }

  const getEntriesByMonth = (date: Date) => {
    return entries.filter(
      (entry) => isSameMonth(entry.date, date) && isSameYear(entry.date, date),
    )
  }

  const getTotalHoursToday = () => {
    const today = new Date()
    const todayEntries = entries.filter((entry) => isSameDay(entry.date, today))
    const totalMinutes = todayEntries.reduce(
      (acc, curr) => acc + curr.durationMinutes,
      0,
    )

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    return `${hours}h ${minutes}m`
  }

  return React.createElement(
    TimeStoreContext.Provider,
    {
      value: {
        entries,
        projects,
        viewDate,
        isLoading,
        isProjectsLoading,
        statusFilter,
        setViewDate,
        setStatusFilter,
        addEntry,
        updateEntry,
        getEntriesByDate,
        getEntriesByMonth,
        getTotalHoursToday,
        refreshEntries: fetchEntries,
      },
    },
    children,
  )
}

const useTimeStore = () => {
  const context = useContext(TimeStoreContext)
  if (!context) {
    throw new Error('useTimeStore must be used within a TimeStoreProvider')
  }
  return context
}

export default useTimeStore
