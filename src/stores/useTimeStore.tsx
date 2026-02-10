import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react'
import { TimeEntry, TimeEntryFormValues, PROJECTS } from '@/lib/types'
import {
  isSameDay,
  isSameMonth,
  isSameYear,
  subDays,
  addDays,
  startOfMonth,
  setHours,
  setMinutes,
} from 'date-fns'

interface TimeState {
  entries: TimeEntry[]
  addEntry: (entry: TimeEntryFormValues) => void
  updateEntry: (id: string, entry: TimeEntryFormValues) => void
  getEntriesByDate: (date: Date) => TimeEntry[]
  getEntriesByMonth: (date: Date) => TimeEntry[]
  getTotalHoursToday: () => string
}

const TimeStoreContext = createContext<TimeState | undefined>(undefined)

// Helper to generate mock data
const generateMockData = (): TimeEntry[] => {
  const entries: TimeEntry[] = []
  const today = new Date()

  const createEntry = (
    date: Date,
    project: string,
    startH: number,
    startM: number,
    endH: number,
    endM: number,
    desc: string,
  ): TimeEntry => {
    const startTime = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM)

    // Set the time on the date object for sorting/accuracy if needed, though we store time strings
    const entryDate = setMinutes(setHours(new Date(date), startH), startM)

    return {
      id: crypto.randomUUID(),
      date: entryDate,
      project,
      startTime,
      endTime,
      description: desc,
      durationMinutes,
    }
  }

  // Generate data for the last 30 days and next 5 days
  for (let i = -20; i <= 5; i++) {
    const date = addDays(today, i)
    // Skip some weekends randomly
    if (Math.random() > 0.8) continue

    // Add 1-3 entries per day
    const numEntries = Math.floor(Math.random() * 3) + 1

    let currentHour = 9
    for (let j = 0; j < numEntries; j++) {
      const duration = Math.floor(Math.random() * 120) + 60 // 1-3 hours
      const project = PROJECTS[Math.floor(Math.random() * PROJECTS.length)]

      const startH = currentHour
      const startM = 0
      const endTotalM = startH * 60 + startM + duration
      const endH = Math.floor(endTotalM / 60)
      const endM = endTotalM % 60

      entries.push(
        createEntry(
          date,
          project,
          startH,
          startM,
          endH,
          endM,
          `Trabajo en ${project} - Tarea #${Math.floor(Math.random() * 1000)}`,
        ),
      )

      currentHour = endH + 1 // Gap of 1 hour
      if (currentHour > 18) break
    }
  }

  return entries
}

export const TimeStoreProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with mock data
  const [entries, setEntries] = useState<TimeEntry[]>([])

  // Load mock data on mount
  useEffect(() => {
    setEntries(generateMockData())
  }, [])

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    return endH * 60 + endM - (startH * 60 + startM)
  }

  const addEntry = (data: TimeEntryFormValues) => {
    const durationMinutes = calculateDuration(data.startTime, data.endTime)
    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      ...data,
      durationMinutes,
    }
    setEntries((prev) => [...prev, newEntry])
  }

  const updateEntry = (id: string, data: TimeEntryFormValues) => {
    const durationMinutes = calculateDuration(data.startTime, data.endTime)
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...data, durationMinutes } : entry,
      ),
    )
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
        addEntry,
        updateEntry,
        getEntriesByDate,
        getEntriesByMonth,
        getTotalHoursToday,
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
