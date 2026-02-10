import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Calendar as CalendarIcon, Briefcase } from 'lucide-react'

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import useTimeStore from '@/stores/useTimeStore'

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

export function TimeEntryTable({ date }: { date: Date }) {
  const { getEntriesByDate } = useTimeStore()
  const entries = getEntriesByDate(date)

  if (entries.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <CalendarIcon className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            No hay registros para este día
          </h3>
          <p className="max-w-xs mx-auto text-sm">
            Tus registros de tiempo aparecerán aquí una vez que comiences a
            trabajar.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-indigo-500" />
          Registros del Día
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[30%]">Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  <TableCell className="font-medium">
                    {format(entry.date, 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>{entry.project}</TableCell>
                  <TableCell>{entry.startTime}</TableCell>
                  <TableCell>{entry.endTime}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    >
                      {formatDuration(entry.durationMinutes)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate max-w-[200px] cursor-default">
                          {entry.description}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs break-words">
                        <p>{entry.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 space-y-3 bg-white animate-fade-in"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {entry.project}
                  </span>
                  <p className="text-sm font-medium text-slate-500">
                    {format(entry.date, 'dd/MM/yyyy')}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                >
                  {formatDuration(entry.durationMinutes)}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {entry.startTime} - {entry.endTime}
                  </span>
                </div>
              </div>

              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                {entry.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
