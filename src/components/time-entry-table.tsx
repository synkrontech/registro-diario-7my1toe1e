import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Clock,
  Calendar as CalendarIcon,
  Briefcase,
  Eye,
  Pencil,
  Trash2,
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
  const { getEntriesByMonth, isLoading } = useTimeStore()
  const entries = getEntriesByMonth(date).sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  )

  if (isLoading && entries.length === 0) {
    return (
      <Card className="border-none shadow-sm bg-white/50 h-48 flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">
          Cargando registros...
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
            No hay registros para este mes
          </h3>
          <p className="max-w-xs mx-auto text-sm">
            Tus registros de tiempo aparecerán aquí una vez que comiences a
            trabajar en este periodo.
          </p>
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
            Registros de {format(date, 'MMMM', { locale: es })}
          </CardTitle>
          <Badge variant="outline" className="text-slate-500 bg-slate-50">
            {entries.length} {entries.length === 1 ? 'registro' : 'registros'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead className="w-[30%]">Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow
                  key={entry.id}
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(entry.date, 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-normal bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100"
                    >
                      {entry.project_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-600">
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
                      className="block truncate max-w-[200px] text-slate-600"
                      title={entry.description}
                    >
                      {entry.description}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        entry.status === 'aprobado'
                          ? 'text-green-600 bg-green-50 border-green-200'
                          : entry.status === 'rechazado'
                            ? 'text-red-600 bg-red-50 border-red-200'
                            : 'text-amber-600 bg-amber-50 border-amber-200'
                      }
                    >
                      {entry.status}
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
                            title="Ver Detalles"
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
                              Detalles del Registro
                            </DialogTitle>
                            <DialogDescription>
                              Información completa de la actividad registrada.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Fecha
                                </h4>
                                <p className="font-medium text-slate-900">
                                  {format(entry.date, 'PPPP', { locale: es })}
                                </p>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                  Proyecto
                                </h4>
                                <p className="font-medium text-indigo-600">
                                  {entry.project_name}
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
                                  Duración Total
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
                                Descripción de Actividad
                              </h4>
                              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 border border-slate-100 leading-relaxed">
                                {entry.description}
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="sm:justify-between gap-2">
                            <span className="text-xs text-muted-foreground self-center">
                              ID: {entry.id.slice(0, 8)}
                            </span>
                            <Button
                              onClick={() => onEdit(entry)}
                              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                              Registro
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(entry)}
                        title="Editar"
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

        {/* Mobile View */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 space-y-3 bg-white animate-fade-in"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {entry.project_name}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {entry.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {format(entry.date, 'EEEE, d MMM', { locale: es })}
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

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[90%] rounded-xl">
                      <DialogHeader>
                        <DialogTitle>Detalle de Actividad</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500 uppercase">
                            Proyecto
                          </span>
                          <p className="font-semibold text-indigo-700 text-lg">
                            {entry.project_name}
                          </p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                          <div className="space-y-1">
                            <span className="text-xs text-slate-500 block">
                              Horario
                            </span>
                            <span className="text-sm font-medium">
                              {entry.startTime} - {entry.endTime}
                            </span>
                          </div>
                          <div className="h-8 w-px bg-slate-200"></div>
                          <div className="space-y-1 text-right">
                            <span className="text-xs text-slate-500 block">
                              Total
                            </span>
                            <span className="text-sm font-bold text-emerald-600">
                              {formatDuration(entry.durationMinutes)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-500 uppercase">
                            Descripción
                          </span>
                          <p className="text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-slate-700">
                            {entry.description}
                          </p>
                        </div>
                        <Button
                          onClick={() => onEdit(entry)}
                          className="w-full bg-indigo-600"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar Registro
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
