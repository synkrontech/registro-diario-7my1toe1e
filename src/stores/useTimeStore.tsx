import React, { createContext, useContext, useState, ReactNode } from 'react'
import { TimeEntry, TimeEntryFormValues } from '@/lib/types'
import { isSameDay, isSameMonth, isSameYear } from 'date-fns'

interface TimeState {
  entries: TimeEntry[]
  addEntry: (entry: TimeEntryFormValues) => void
  updateEntry: (id: string, entry: TimeEntryFormValues) => void
  getEntriesByDate: (date: Date) => TimeEntry[]
  getEntriesByMonth: (date: Date) => TimeEntry[]
  getTotalHoursToday: () => string
}

const TimeStoreContext = createContext<TimeState | undefined>(undefined)

export const TimeStoreProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<TimeEntry[]>([])

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
