import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TimeEntry } from '@/lib/types'
import { format } from 'date-fns'
import { Clock, Calendar, Briefcase, Building2, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'

interface DayDetailsSheetProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  entries: TimeEntry[]
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function DayDetailsSheet({
  isOpen,
  onClose,
  date,
  entries,
}: DayDetailsSheetProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  if (!date) return null

  const totalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-indigo-600" />
            {format(date, 'PPPP', { locale: dateLocale })}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Total:{' '}
            <span className="font-semibold text-slate-900">
              {formatDuration(totalMinutes)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6 py-4">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-slate-300" />
              </div>
              <p>{t('timeEntry.noEntries')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((entry, index) => (
                  <div
                    key={entry.id}
                    className="relative pl-4 border-l-2 border-slate-100 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100"
                        >
                          {entry.project_name}
                        </Badge>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded">
                          {entry.startTime} - {entry.endTime}
                        </span>
                      </div>

                      <div className="flex gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          <span>{entry.client_name || '-'}</span>
                        </div>
                        <span className="text-slate-300">•</span>
                        <div className="flex items-center gap-1">
                          <Monitor className="h-3 w-3" />
                          <span>{entry.system_name || '-'}</span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">
                        {entry.description}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className="h-5 text-[10px] bg-emerald-50 text-emerald-700"
                        >
                          {formatDuration(entry.durationMinutes)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 capitalize"
                        >
                          {t(`enums.timeEntryStatus.${entry.status}`)}
                        </Badge>
                      </div>
                    </div>
                    {index < entries.length - 1 && (
                      <Separator className="mt-6" />
                    )}
                  </div>
                ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
