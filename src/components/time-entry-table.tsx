import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Eye,
  Pencil,
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

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

interface TimeEntryTableProps {
  date: Date
  onEdit: (entry: TimeEntry) => void
}

export function TimeEntryTable({ date, onEdit }: TimeEntryTableProps) {
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
                <TableHead>Horario</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[30%]">Descripción</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                  <TableCell>
                    {entry.startTime} - {entry.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    >
                      {formatDuration(entry.durationMinutes)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="block truncate max-w-[200px]">
                      {entry.description}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Detalles del Registro</DialogTitle>
                            <DialogDescription>
                              Información completa de la actividad
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">
                                  Fecha
                                </h4>
                                <p className="font-medium">
                                  {format(entry.date, 'P', { locale: es })}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">
                                  Proyecto
                                </h4>
                                <p className="font-medium text-indigo-600">
                                  {entry.project}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">
                                  Horario
                                </h4>
                                <p className="font-medium">
                                  {entry.startTime} - {entry.endTime}
                                </p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-slate-500">
                                  Duración
                                </h4>
                                <Badge variant="secondary" className="mt-1">
                                  {formatDuration(entry.durationMinutes)}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-slate-500 mb-1">
                                Descripción
                              </h4>
                              <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-700 border">
                                {entry.description}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={() => onEdit(entry)}
                              className="w-full sm:w-auto"
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-blue-600"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
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
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit(entry)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-lg">
                      <DialogHeader>
                        <DialogTitle>Detalle de Actividad</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Proyecto
                          </span>
                          <p className="font-semibold text-indigo-700">
                            {entry.project}
                          </p>
                        </div>
                        <div className="flex justify-between">
                          <div className="space-y-1">
                            <span className="text-xs text-slate-500">
                              Horario
                            </span>
                            <p className="text-sm font-medium">
                              {entry.startTime} - {entry.endTime}
                            </p>
                          </div>
                          <div className="space-y-1 text-right">
                            <span className="text-xs text-slate-500">
                              Total
                            </span>
                            <p className="text-sm font-bold text-emerald-600">
                              {formatDuration(entry.durationMinutes)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500">
                            Descripción
                          </span>
                          <p className="text-sm bg-slate-50 p-2 rounded border">
                            {entry.description}
                          </p>
                        </div>
                        <Button
                          onClick={() => onEdit(entry)}
                          className="w-full"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar Registro
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {entry.startTime} - {entry.endTime}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 border-none"
                >
                  {formatDuration(entry.durationMinutes)}
                </Badge>
              </div>

              <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md line-clamp-2">
                {entry.description}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
