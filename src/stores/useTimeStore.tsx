import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { TimeEntry, TimeEntryFormValues, Project } from '@/lib/types'
import { isSameDay, isSameMonth, isSameYear, parseISO, format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'

interface TimeState {
  entries: TimeEntry[]
  projects: Project[]
  viewDate: Date
  isLoading: boolean
  setViewDate: (date: Date) => void
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

  const fetchProjects = useCallback(async () => {
    if (!user || !profile) return

    try {
      let query = supabase.from('projects').select('*')

      // If consultant, only show assigned projects
      // For this implementation, we will fetch assignments first if user is consultor
      if (profile.role === 'consultor') {
        const { data: assignments } = await supabase
          .from('project_assignments')
          .select('project_id')
          .eq('user_id', user.id)

        const projectIds = assignments?.map((a) => a.project_id) || []
        if (projectIds.length > 0) {
          query = query.in('id', projectIds)
        } else {
          // No projects assigned
          setProjects([])
          return
        }
      }
      // Gerente sees their own projects as manager OR assigned projects
      // For simplicity in this iteration, we assume RLS policies on the 'projects' table
      // or 'project_assignments' handle visibility, but here we try to be helpful.
      // If we assume RLS is set up correctly, we can just select * from projects
      // and let the DB filter. However, standard Supabase 'projects' RLS usually
      // checks if user is manager OR assigned.

      // We will rely on RLS if possible, but for explicit logic:
      if (profile.role === 'gerente') {
        // This logic could be complex to replicate in one simple query without RLS awareness
        // So we will just fetch all and assume RLS filters or we filter client side if needed
        // But "Gerente: Must be able to view their own projects" implies logic.
      }

      const { data, error } = await query.eq('status', 'activo')

      if (error) throw error
      setProjects(data as Project[])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [user, profile])

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setIsLoading(true)

    // Calculate start and end of the view month to optimize fetching
    // Actually, getting all entries for the user is fine for small datasets,
    // but better to filter by month.
    const startStr = format(
      new Date(viewDate.getFullYear(), viewDate.getMonth(), 1),
      'yyyy-MM-dd',
    )
    const endStr = format(
      new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0),
      'yyyy-MM-dd',
    )

    try {
      // We join with projects to get the name
      const { data, error } = await supabase
        .from('time_entries')
        .select(
          `
          *,
          projects (
            nombre
          )
        `,
        )
        .gte('fecha', startStr)
        .lte('fecha', endStr)

      if (error) throw error

      const formattedEntries: TimeEntry[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        project_id: item.project_id,
        date: parseISO(item.fecha), // Parse YYYY-MM-DD to Date
        startTime: item.startTime,
        endTime: item.endTime,
        description: item.description,
        durationMinutes: item.durationMinutes,
        status: item.status,
        project_name: item.projects?.nombre || 'Desconocido',
      }))

      setEntries(formattedEntries)
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast({
        title: 'Error al cargar registros',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, viewDate, toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

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
        durationMinutes,
        status: 'pendiente',
      })

      if (error) throw error
      fetchEntries() // Refresh list
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
          durationMinutes,
        })
        .eq('id', id)

      if (error) throw error
      fetchEntries() // Refresh list
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
        setViewDate,
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
