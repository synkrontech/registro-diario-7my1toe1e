import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { useTranslation } from 'react-i18next'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar as CalendarIcon,
  Layers,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export function DirectorDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getDirectorMetrics(
        dateRange.from,
        dateRange.to,
      )
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, dateRange])

  if (loading && !data)
    return (
      <div className="h-96 flex items-center justify-center">Loading...</div>
    )

  const { kpis, charts, topProjects } = data || {}
  const COLORS = [
    '#3b82f6',
    '#22c55e',
    '#eab308',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
  ]

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {t('sidebar.dashboard')}
        </h1>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[240px] justify-start text-left font-normal bg-white"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                    {format(dateRange.to, 'dd/MM/yyyy')}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy')
                )
              ) : (
                <span>{t('reports.dateRange')}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range: any) => range && setDateRange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('dashboard.director.totalMonthlyHours')}
          value={kpis?.totalMonthlyHours.toFixed(1)}
          icon={Clock}
          color="blue"
        />
        <KpiCard
          title={t('dashboard.director.activeProjects')}
          value={kpis?.totalActiveProjects}
          icon={Layers}
          color="indigo"
        />
        <KpiCard
          title={t('dashboard.director.activeConsultants')}
          value={kpis?.totalActiveConsultants}
          icon={Users}
          color="yellow"
        />
        <KpiCard
          title={t('dashboard.director.approvalRate')}
          value={`${kpis?.approvalRate.toFixed(1)}%`}
          icon={CheckCircle2}
          color={kpis?.approvalRate >= 80 ? 'green' : 'red'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Client (Donut) */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>{t('dashboard.director.byClient')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={charts?.byClient}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {charts?.byClient.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* By System (Bar) */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>{t('dashboard.director.bySystem')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer>
                <BarChart data={charts?.bySystem}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name={t('common.hours')}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* By Work Front (Horizontal Bar) */}
        <Card className="shadow-sm rounded-xl lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('dashboard.director.byWorkFront')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer>
                <BarChart
                  data={charts?.byWorkFront}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="#ec4899"
                    radius={[0, 4, 4, 0]}
                    name={t('common.hours')}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top 10 Projects Table */}
        <Card className="shadow-sm rounded-xl lg:col-span-8">
          <CardHeader>
            <CardTitle>{t('dashboard.director.topProjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('projects.project')}</TableHead>
                  <TableHead>{t('timeEntry.client')}</TableHead>
                  <TableHead>{t('projects.manager')}</TableHead>
                  <TableHead className="text-right">
                    {t('common.hours')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProjects?.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.project}</TableCell>
                    <TableCell>{p.client}</TableCell>
                    <TableCell>{p.manager}</TableCell>
                    <TableCell className="text-right font-bold">
                      {p.hours.toFixed(1)}
                    </TableCell>
                  </TableRow>
                ))}
                {topProjects?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  const colorClass =
    {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      indigo: 'text-indigo-600 bg-indigo-50',
      red: 'text-red-600 bg-red-50',
    }[color as string] || 'text-slate-600 bg-slate-50'

  return (
    <Card className="shadow-sm rounded-xl border-none">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold mt-1 text-slate-900">{value}</div>
        </div>
        <div className={cn('p-3 rounded-full', colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  )
}
