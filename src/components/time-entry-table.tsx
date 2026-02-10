import { format } from 'date-fns'
import {
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Eye,
  Pencil,
  Hourglass,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import useTimeStore from '@/stores/useTimeStore'
import { TimeEntry } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

interface TimeEntryTableProps {
  date: Date
  onEdit: (entry: TimeEntry) => void
}

const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case 'aprobado':
      return {
        className: 'text-green-800 bg-green-100 border-green-200',
        icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
      }
    case 'rechazado':
      return {
        className: 'text-red-800 bg-red-100 border-red-200',
        icon: <XCircle className="mr-1 h-3 w-3" />,
      }
    case 'pendiente':
    default:
      return {
        className: 'text-amber-800 bg-amber-100 border-amber-200',
        icon: <Hourglass className="mr-1 h-3 w-3" />,
      }
  }
}

export function TimeEntryTable({ date, onEdit }: TimeEntryTableProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { getEntriesByMonth, isLoading, statusFilter } = useTimeStore()

  const allEntries = getEntriesByMonth(date)

  const entries = allEntries
    .filter((entry) => statusFilter === 'all' || entry.status === statusFilter)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  if (isLoading && entries.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white/50 h-48 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          {t('common.loading')}
        </div>
      </Card>
    )
  }

  if (entries.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <CalendarIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {t('timeEntry.noEntries')}
          </h3>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-500" />
            {t('common.month')}: {format(date, 'MMMM', { locale: dateLocale })}
          </CardTitle>
          <Badge variant="outline" className="text-slate-500 bg-slate-50">
            {entries.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>{t('timeEntry.date')}</TableHead>
                <TableHead>{t('timeEntry.project')}</TableHead>
                <TableHead>{t('timeEntry.client')}</TableHead>
                <TableHead>{t('timeEntry.system')}</TableHead>
                <TableHead>
                  {t('timeEntry.startTime')} / {t('timeEntry.endTime')}
                </TableHead>
                <TableHead>{t('timeEntry.duration')}</TableHead>
                <TableHead className="w-[20%]">
                  {t('timeEntry.description')}
                </TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">
                  {t('common.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const badgeConfig = getStatusBadgeConfig(entry.status)
                return (
                  <TableRow
                    key={entry.id}
                    className="hover:bg-slate-50/80 transition-colors duration-150"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(entry.date, 'P', { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100"
                      >
                        {entry.project_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {entry.client_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {entry.system_name || '-'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600 text-xs">
                      {entry.startTime} - {entry.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100"
                      >
                        {formatDuration(entry.durationMinutes)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className="block truncate max-w-[200px] text-slate-600 text-sm"
                        title={entry.description}
                      >
                        {entry.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'flex items-center w-fit',
                          badgeConfig.className,
                        )}
                      >
                        {badgeConfig.icon}
                        {t(`enums.timeEntryStatus.${entry.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                              title={t('common.viewDetails')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <div className="p-2 rounded-md bg-indigo-100">
                                  <Clock className="h-5 w-5 text-indigo-600" />
                                </div>
                                {t('common.viewDetails')}
                              </DialogTitle>
                              <DialogDescription>
                                ID: {entry.id.slice(0, 8)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t('timeEntry.date')}
                                  </h4>
                                  <p className="font-medium text-slate-900">
                                    {format(entry.date, 'PPPP', {
                                      locale: dateLocale,
                                    })}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t('timeEntry.project')}
                                  </h4>
                                  <p className="font-medium text-indigo-600">
                                    {entry.project_name}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t('timeEntry.client')}
                                  </h4>
                                  <p className="font-medium text-slate-900">
                                    {entry.client_name || '-'}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t('timeEntry.system')}
                                  </h4>
                                  <p className="font-medium text-slate-900">
                                    {entry.system_name || '-'}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Horario
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">
                                      {entry.startTime}
                                    </Badge>
                                    <span className="text-slate-400">-</span>
                                    <Badge variant="outline">
                                      {entry.endTime}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {t('timeEntry.duration')}
                                  </h4>
                                  <Badge
                                    variant="secondary"
                                    className="bg-emerald-100 text-emerald-800 border-none"
                                  >
                                    {formatDuration(entry.durationMinutes)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  {t('timeEntry.description')}
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-100 leading-relaxed">
                                  {entry.description}
                                </div>
                              </div>
                            </div>
                            <DialogFooter className="sm:justify-between gap-2">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'flex items-center',
                                  badgeConfig.className,
                                )}
                              >
                                {badgeConfig.icon}
                                {t(`enums.timeEntryStatus.${entry.status}`)}
                              </Badge>
                              <Button
                                onClick={() => onEdit(entry)}
                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Pencil className="mr-2 h-4 w-4" />{' '}
                                {t('common.edit')}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => onEdit(entry)}
                          title={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {entries.map((entry) => {
            const badgeConfig = getStatusBadgeConfig(entry.status)
            return (
              <div
                key={entry.id}
                className="p-4 space-y-3 bg-white animate-fade-in"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {entry.project_name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0 flex items-center gap-1',
                          badgeConfig.className,
                        )}
                      >
                        {badgeConfig.icon}
                        {t(`enums.timeEntryStatus.${entry.status}`)}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      {format(entry.date, 'EEEE, P', { locale: dateLocale })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(entry)}
                    >
                      <Pencil className="h-4 w-4 text-slate-500" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded text-xs">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      {entry.startTime} - {entry.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded text-xs text-emerald-700">
                    <span className="font-semibold">
                      {formatDuration(entry.durationMinutes)}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-slate-600 line-clamp-2 pl-2 border-l-2 border-slate-200 italic">
                  {entry.description}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
