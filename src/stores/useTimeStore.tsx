import React, { createContext, useContext, useState, ReactNode } from 'react'
import { TimeEntry, TimeEntryFormValues } from '@/lib/types'
import { isSameDay } from 'date-fns'

interface TimeState {
  entries: TimeEntry[]
  addEntry: (entry: TimeEntryFormValues) => void
  getEntriesByDate: (date: Date) => TimeEntry[]
  getTotalHoursToday: () => string
}

const TimeStoreContext = createContext<TimeState | undefined>(undefined)

export const TimeStoreProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([])

  const addEntry = (data: TimeEntryFormValues) => {
    const [startH, startM] = data.startTime.split(':').map(Number)
    const [endH, endM] = data.endTime.split(':').map(Number)
    const durationMinutes = endH * 60 + endM - (startH * 60 + startM)

    const newEntry: TimeEntry = {
      id: crypto.randomUUID(),
      ...data,
      durationMinutes,
    }

    setEntries((prev) => [...prev, newEntry])
  }

  const getEntriesByDate = (date: Date) => {
    return entries.filter((entry) => isSameDay(entry.date, date))
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
        getEntriesByDate,
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
