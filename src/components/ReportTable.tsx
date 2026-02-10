import { Fragment } from 'react'
import { TimeEntry } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format, getWeek } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'

interface ReportTableProps {
  entries: TimeEntry[]
}

export function ReportTable({ entries }: ReportTableProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  // Group by week
  const groupedEntries = entries.reduce(
    (acc, entry) => {
      const week = getWeek(entry.date, { locale: dateLocale })
      if (!acc[week]) acc[week] = []
      acc[week].push(entry)
      return acc
    },
    {} as Record<string, TimeEntry[]>,
  )

  const sortedWeeks = Object.keys(groupedEntries).sort(
    (a, b) => parseInt(a) - parseInt(b),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200'
    }
  }

  const totalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )
  const totalHours = (totalMinutes / 60).toFixed(2)

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[100px]">{t('timeEntry.date')}</TableHead>
            <TableHead>{t('timeEntry.project')}</TableHead>
            <TableHead>{t('timeEntry.client')}</TableHead>
            <TableHead>{t('timeEntry.system')}</TableHead>
            <TableHead className="w-[120px]">
              {t('timeEntry.startTime')} - {t('timeEntry.endTime')}
            </TableHead>
            <TableHead className="text-right w-[100px]">
              {t('reports.hoursWorked')}
            </TableHead>
            <TableHead className="w-[30%]">
              {t('timeEntry.description')}
            </TableHead>
            <TableHead className="w-[100px] text-right">
              {t('common.status')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-24 text-center text-muted-foreground"
              >
                {t('timeEntry.noEntries')}
              </TableCell>
            </TableRow>
          ) : (
            sortedWeeks.map((weekStr) => {
              const weekEntries = groupedEntries[weekStr]
              const weekMinutes = weekEntries.reduce(
                (acc, curr) => acc + curr.durationMinutes,
                0,
              )
              const weekHours = (weekMinutes / 60).toFixed(2)

              return (
                <Fragment key={weekStr}>
                  <TableRow
                    key={`week-${weekStr}`}
                    className="bg-slate-50/50 hover:bg-slate-50/50"
                  >
                    <TableCell
                      colSpan={8}
                      className="font-semibold text-xs text-slate-500 uppercase tracking-wider py-2"
                    >
                      {t('reports.week')} {weekStr}
                    </TableCell>
                  </TableRow>
                  {weekEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(entry.date, 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{entry.project_name}</TableCell>
                      <TableCell>{entry.client_name}</TableCell>
                      <TableCell>{entry.system_name}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">
                          {entry.startTime}
                        </span>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">
                          {entry.endTime}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(entry.durationMinutes / 60).toFixed(2)}h
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-slate-600">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(getStatusColor(entry.status))}
                        >
                          {t(`enums.timeEntryStatus.${entry.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow
                    key={`week-subtotal-${weekStr}`}
                    className="bg-indigo-50/30 font-medium"
                  >
                    <TableCell
                      colSpan={5}
                      className="text-right text-indigo-900"
                    >
                      {t('reports.weeklySubtotal')}
                    </TableCell>
                    <TableCell className="text-right text-indigo-700">
                      {weekHours}h
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </Fragment>
              )
            })
          )}
        </TableBody>
        {entries.length > 0 && (
          <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-right font-bold text-indigo-900 text-base"
              >
                {t('reports.monthlyTotal')}
              </TableCell>
              <TableCell className="text-right font-bold text-indigo-700 text-base">
                {totalHours}h
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  )
}
