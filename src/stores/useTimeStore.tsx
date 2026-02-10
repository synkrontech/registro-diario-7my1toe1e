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
import { supabase } from '@/lib/supabase/client'
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
    if (!user) return

    try {
      // RLS policies now handle visibility
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'activo')

      if (error) throw error
      setProjects(data as Project[])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }, [user])

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
      // We join with projects to get the name
      // Note: Supabase JS types might need explicit casting if not fully auto-generated
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
        date: parseISO(item.fecha),
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
          durationMinutes,
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
