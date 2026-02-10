import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import useTimeStore from '@/stores/useTimeStore'
import { BarChart, Clock } from 'lucide-react'
import { PROJECTS } from '@/lib/types'

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

  return (
    <Card className="border-none shadow-md bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-indigo-500" />
            Reporte Mensual
          </CardTitle>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full capitalize">
            {format(date, 'MMMM yyyy', { locale: es })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Clock className="h-8 w-8 text-indigo-600 mb-2" />
            <span className="text-sm text-indigo-600 font-medium">
              Total Horas
            </span>
            <span className="text-3xl font-bold text-indigo-900">
              {totalHours}h {remainingMinutes}m
            </span>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Desglose por Proyecto
            </h4>
            {projectStats.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No hay registros este mes.
              </p>
            ) : (
              <div className="space-y-3">
                {projectStats.map((stat) => (
                  <div
                    key={stat.name}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-md border border-slate-100"
                  >
                    <span className="font-medium text-slate-700">
                      {stat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {stat.hours}h
                      </span>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{
                            width: `${Math.min((stat.minutes / totalMinutes) * 100, 100)}%`,
                          }}
                        />
                      </div>
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
