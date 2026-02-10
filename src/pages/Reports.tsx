import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'
import { es, enUS, ptBR } from 'date-fns/locale'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
  Label,
  YAxis,
} from 'recharts'
import {
  Calendar as CalendarIcon,
  Download,
  Filter,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { useAuth } from '@/components/AuthProvider'
import { TimeEntry } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useDateLocale } from '@/components/LanguageSelector'

export default function Reports() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const dateLocale = useDateLocale()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const isAdmin =
    profile?.role === 'admin' ||
    profile?.role === 'director' ||
    profile?.role === 'gerente'

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, currentDate])

  const fetchData = async () => {
    setIsLoading(true)
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)

    try {
      let query = supabase
        .from('time_entries')
        .select(
          `
          *,
          projects (
            nombre,
            clients ( nombre ),
            systems ( nombre )
          )
        `,
        )
        .gte('fecha', format(start, 'yyyy-MM-dd'))
        .lte('fecha', format(end, 'yyyy-MM-dd'))
        .order('fecha', { ascending: true })

      // If not admin/manager, only see own entries
      // Even admins might want to see only their entries by default in this view,
      // but usually reports are for the user. Let's assume personal reports for now
      // as the dashboard is personal.
      // If we wanted global reports, we would have a different switch.
      // For now, let's keep it personal for everyone as per "Daily Log" concept.
      query = query.eq('user_id', user!.id)

      const { data, error } = await query

      if (error) throw error

      const formattedEntries: TimeEntry[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        project_id: item.project_id,
        date: new Date(item.fecha),
        startTime: item.startTime,
        endTime: item.endTime,
        description: item.description,
        durationMinutes: item.durationMinutes,
        status: item.status,
        project_name: item.projects?.nombre || 'Desconocido',
        client_name: item.projects?.clients?.nombre || '-',
        system_name: item.projects?.systems?.nombre || '-',
      }))

      setEntries(formattedEntries)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  // --- Aggregation Logic ---

  const filteredEntries = useMemo(() => {
    return statusFilter === 'all'
      ? entries
      : entries.filter((e) => e.status === statusFilter)
  }, [entries, statusFilter])

  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce(
      (acc, curr) => acc + curr.durationMinutes,
      0,
    )
    const totalHours = totalMinutes / 60

    const projectsSet = new Set(filteredEntries.map((e) => e.project_name))

    const byStatus = {
      approved:
        filteredEntries
          .filter((e) => e.status === 'aprobado')
          .reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60,
      pending:
        filteredEntries
          .filter((e) => e.status === 'pendiente')
          .reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60,
      rejected:
        filteredEntries
          .filter((e) => e.status === 'rechazado')
          .reduce((acc, curr) => acc + curr.durationMinutes, 0) / 60,
    }

    return {
      totalHours: totalHours.toFixed(1),
      projectCount: projectsSet.size,
      byStatus,
    }
  }, [filteredEntries])

  // Chart 1: Daily Hours
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    })

    return days.map((day) => {
      const dayEntries = filteredEntries.filter((e) => isSameDay(e.date, day))
      const minutes = dayEntries.reduce(
        (acc, curr) => acc + curr.durationMinutes,
        0,
      )
      return {
        date: format(day, 'd', { locale: dateLocale }),
        fullDate: format(day, 'PP', { locale: dateLocale }),
        hours: parseFloat((minutes / 60).toFixed(1)),
      }
    })
  }, [filteredEntries, currentDate, dateLocale])

  // Chart 2: Project Distribution
  const projectData = useMemo(() => {
    const map = new Map<string, number>()
    filteredEntries.forEach((e) => {
      const current = map.get(e.project_name) || 0
      map.set(e.project_name, current + e.durationMinutes)
    })

    const data = Array.from(map.entries())
      .map(([name, minutes], index) => ({
        name,
        hours: parseFloat((minutes / 60).toFixed(1)),
        fill: `hsl(var(--chart-${(index % 5) + 1}))`,
      }))
      .sort((a, b) => b.hours - a.hours)

    return data
  }, [filteredEntries])

  const chartConfig = {
    hours: {
      label: t('timeEntry.hours') || 'Horas',
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <PieChartIcon className="h-8 w-8 text-indigo-600" />
            {t('sidebar.reports')}
          </h2>
          <p className="text-muted-foreground">{t('common.welcomeSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center font-medium">
            <CalendarIcon className="h-4 w-4 text-slate-500" />
            <span className="capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t('timeEntry.filterByStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="pendiente">
              {t('enums.timeEntryStatus.pendiente')}
            </SelectItem>
            <SelectItem value="aprobado">
              {t('enums.timeEntryStatus.aprobado')}
            </SelectItem>
            <SelectItem value="rechazado">
              {t('enums.timeEntryStatus.rechazado')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Summary Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                {t('timeEntry.totalAccumulated')}
              </CardDescription>
              <CardTitle className="text-4xl">{stats.totalHours}h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('timeEntry.project')}</CardDescription>
              <CardTitle className="text-4xl">{stats.projectCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {t('common.active')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('timeEntry.approvedHours')}</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                {stats.byStatus.approved.toFixed(1)}h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {(
                  (stats.byStatus.approved /
                    (parseFloat(stats.totalHours) || 1)) *
                  100
                ).toFixed(0)}
                % {t('common.of')} Total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{t('timeEntry.pendingHours')}</CardDescription>
              <CardTitle className="text-4xl text-orange-600">
                {stats.byStatus.pending.toFixed(1)}h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {t('enums.timeEntryStatus.pendiente')}
              </div>
            </CardContent>
          </Card>

          {/* Daily Chart */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>{t('timeEntry.monthlyStats')}</CardTitle>
              <CardDescription>
                {t('timeEntry.duration')} ({t('common.active')})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart
                  data={dailyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar
                    dataKey="hours"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    name={t('timeEntry.duration')}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Project Distribution Chart */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>{t('timeEntry.projectBreakdown')}</CardTitle>
              <CardDescription>{t('timeEntry.project')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={{
                  hours: { label: 'Hours', color: 'hsl(var(--chart-1))' },
                }}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={projectData}
                    dataKey="hours"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {stats.totalHours}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground text-xs"
                              >
                                Hours
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
