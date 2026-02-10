import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useTimeStore from '@/stores/useTimeStore'
import { BarChart, Clock, CalendarDays, Download } from 'lucide-react'
import { PROJECTS } from '@/lib/types'
import { downloadMonthlyCsv } from '@/lib/csv-export'
import { cn } from '@/lib/utils'

export function MonthlyReport({ date }: { date: Date }) {
  const { getEntriesByMonth } = useTimeStore()
  const entries = getEntriesByMonth(date)

  const totalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const projectStats = PROJECTS.map((project) => {
    const minutes = entries
      .filter((e) => e.project === project)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0)
    return {
      name: project,
      minutes,
      hours: (minutes / 60).toFixed(1),
    }
  })
    .filter((stat) => stat.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)

  const handleExport = () => {
    downloadMonthlyCsv(entries, date)
  }

  return (
    <Card className="border-none shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-indigo-500" />
              Resumen Mensual
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
              onClick={handleExport}
              disabled={entries.length === 0}
              title="Exportar registros del mes a CSV"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>
          <p className="text-sm text-muted-foreground capitalize flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(date, 'MMMM yyyy', { locale: es })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6">
          <div className="bg-indigo-600 rounded-xl p-6 text-center text-white shadow-lg shadow-indigo-200 transform transition-all hover:scale-[1.02]">
            <Clock className="h-8 w-8 mx-auto mb-2 text-indigo-200" />
            <span className="text-xs font-medium text-indigo-100 uppercase tracking-widest opacity-80">
              Total Acumulado
            </span>
            <div className="text-4xl font-bold mt-1 tracking-tight">
              {totalHours}h{' '}
              <span className="text-2xl font-normal text-indigo-200">
                {remainingMinutes}m
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-2">
              Desglose por Proyecto
            </h4>
            {projectStats.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-sm text-muted-foreground italic">
                  No hay registros para este mes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {projectStats.map((stat) => (
                  <div key={stat.name} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">
                        {stat.name}
                      </span>
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {stat.hours}h
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out group-hover:bg-indigo-600"
                        style={{
                          width: `${Math.min((stat.minutes / totalMinutes) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
