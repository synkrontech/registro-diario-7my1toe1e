import { useState } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  getWeek,
} from 'date-fns'
import { Download } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import useTimeStore from '@/stores/useTimeStore'
import { DayDetailsSheet } from '@/components/day-details-sheet'
import { downloadMonthlyCsv } from '@/lib/csv-export'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'

interface CalendarViewProps {
  currentDate: Date
}

export function CalendarView({ currentDate }: CalendarViewProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { getEntriesByDate, getEntriesByMonth } = useTimeStore()
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  // Group days into weeks
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  calendarDays.forEach((day) => {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
  }

  // Monthly stats
  const monthlyEntries = getEntriesByMonth(currentDate)
  const totalMonthlyMinutes = monthlyEntries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )
  const totalMonthlyHours = (totalMonthlyMinutes / 60).toFixed(1)

  const handleExport = () => {
    downloadMonthlyCsv(monthlyEntries, currentDate, dateLocale)
  }

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom', 'Total']
  // Use date-fns for dynamic day headers
  const dayHeaders = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return format(d, 'EEE', { locale: dateLocale })
  })

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-lg border shadow-sm gap-4">
          <div className="flex flex-col items-center md:items-start w-full md:w-auto">
            <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
              {t('timeEntry.totalAccumulated')}
            </span>
            <div className="text-3xl font-bold text-indigo-600">
              {totalMonthlyHours}{' '}
              <span className="text-lg text-slate-500 font-normal">h</span>
            </div>
          </div>

          <div className="flex flex-col-reverse md:flex-row items-center gap-4 w-full md:w-auto">
            <div className="hidden sm:block text-center md:text-right">
              <span className="text-xs text-muted-foreground">
                {t('common.month')}:{' '}
                {format(currentDate, 'MMMM', { locale: dateLocale })}
              </span>
              <p className="font-medium text-slate-900">
                {monthlyEntries.length} actividades
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full md:w-auto bg-white hover:bg-slate-50 text-slate-600"
              onClick={handleExport}
              disabled={monthlyEntries.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('common.exportCsv')}
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden bg-white">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold text-slate-800">
              {t('timeEntry.calendarView')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Calendar Grid */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b bg-slate-50/80">
                  {dayHeaders.map((day) => (
                    <div
                      key={day}
                      className="py-3 px-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {day}
                    </div>
                  ))}
                  <div className="py-3 px-2 text-center text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-slate-100 border-l">
                    Total
                  </div>
                </div>

                {/* Weeks */}
                <div className="divide-y">
                  {weeks.map((week, weekIndex) => {
                    const weekMinutes = week.reduce((acc, day) => {
                      const dayEntries = getEntriesByDate(day)
                      return (
                        acc +
                        dayEntries.reduce(
                          (eAcc, entry) => eAcc + entry.durationMinutes,
                          0,
                        )
                      )
                    }, 0)
                    const weekHours = (weekMinutes / 60).toFixed(1)

                    return (
                      <div key={weekIndex} className="grid grid-cols-8 group">
                        {week.map((day, dayIndex) => {
                          const isCurrentMonth = isSameMonth(day, monthStart)
                          const isToday = isSameDay(day, new Date())
                          const dayEntries = getEntriesByDate(day)
                          const dayMinutes = dayEntries.reduce(
                            (acc, curr) => acc + curr.durationMinutes,
                            0,
                          )
                          const dayHours = (dayMinutes / 60).toFixed(1)
                          const hasActivity = dayMinutes > 0

                          return (
                            <div
                              key={day.toISOString()}
                              className={cn(
                                'min-h-[100px] p-2 border-r last:border-r-0 relative transition-all hover:bg-slate-50 cursor-pointer',
                                !isCurrentMonth &&
                                  'bg-slate-50/30 text-slate-400',
                                isToday && 'bg-blue-50/30',
                              )}
                              onClick={() => handleDayClick(day)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={cn(
                                    'text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full',
                                    isToday
                                      ? 'bg-blue-600 text-white shadow-sm'
                                      : 'text-slate-700',
                                  )}
                                >
                                  {format(day, 'd')}
                                </span>
                                {hasActivity && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'text-[10px] h-5 px-1.5',
                                      dayMinutes >= 480
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : dayMinutes >= 240
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-amber-100 text-amber-800',
                                    )}
                                  >
                                    {dayHours}h
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-1">
                                {dayEntries.slice(0, 3).map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="text-[10px] truncate px-1.5 py-0.5 rounded bg-white border border-slate-100 text-slate-600 shadow-sm"
                                    title={`${entry.project_name} - ${entry.client_name}`}
                                  >
                                    {entry.project_name}
                                  </div>
                                ))}
                                {dayEntries.length > 3 && (
                                  <div className="text-[10px] text-center text-muted-foreground font-medium">
                                    +{dayEntries.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* Weekly Total Column */}
                        <div className="bg-slate-50/50 flex flex-col items-center justify-center border-l p-2">
                          <span className="text-xs text-slate-500 font-medium uppercase mb-1">
                            Sem {getWeek(week[0])}
                          </span>
                          <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-3">
                            {weekHours}h
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DayDetailsSheet
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        entries={selectedDate ? getEntriesByDate(selectedDate) : []}
      />
    </>
  )
}
