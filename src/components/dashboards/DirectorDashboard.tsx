import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { clientService } from '@/services/clientService'
import { systemService } from '@/services/systemService'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Loader2,
  Calendar as CalendarIcon,
  Activity,
  Users,
  Layers,
  PieChart as PieChartIcon,
  TrendingUp,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { ExecutiveReportTable } from '@/components/ExecutiveReportTable'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function DirectorDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [clients, setClients] = useState<any[]>([])
  const [systems, setSystems] = useState<any[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedSystems, setSelectedSystems] = useState<string[]>([])
  const [selectedWorkFront, setSelectedWorkFront] = useState<string>('all')

  useEffect(() => {
    const loadFilters = async () => {
      const [c, s] = await Promise.all([
        clientService.getClients(),
        systemService.getSystems(),
      ])
      setClients(c.map((i) => ({ label: i.nombre, value: i.id })))
      setSystems(s.map((i) => ({ label: i.nombre, value: i.id })))
    }
    loadFilters()
  }, [])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getDirectorMetrics({
        clientIds: selectedClients,
        systemIds: selectedSystems,
        workFront: selectedWorkFront === 'all' ? null : selectedWorkFront,
        from: dateRange.from,
        to: dateRange.to,
      })
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, dateRange, selectedClients, selectedSystems, selectedWorkFront])

  const { kpis, charts, consolidatedTable } = data || {}
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {t('dashboard.director.totalHours')} -{' '}
          {t('reports.executiveReportTitle')}
        </h1>

        {/* Filters Bar */}
        <Card className="bg-slate-50/50">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                {t('reports.executive.filterClients')}
              </label>
              <MultiSelect
                options={clients}
                selected={selectedClients}
                onChange={setSelectedClients}
                placeholder={t('common.all')}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                {t('reports.executive.filterSystems')}
              </label>
              <MultiSelect
                options={systems}
                selected={selectedSystems}
                onChange={setSelectedSystems}
                placeholder={t('common.all')}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                {t('reports.executive.filterWorkFront')}
              </label>
              <Select
                value={selectedWorkFront}
                onValueChange={setSelectedWorkFront}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="Procesos">Procesos</SelectItem>
                  <SelectItem value="SAP IBP">SAP IBP</SelectItem>
                  <SelectItem value="SAP MDG">SAP MDG</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">
                {t('reports.dateRange')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM')} -{' '}
                          {format(dateRange.to, 'dd/MM')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Select</span>
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
          </CardContent>
        </Card>
      </div>

      {loading && !data ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* KPI Executive Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('dashboard.director.totalHours')}
                    </p>
                    <h3 className="text-3xl font-bold mt-2">
                      {kpis?.totalHours.toFixed(0)}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      kpis?.totalHoursDiff >= 0 ? 'default' : 'destructive'
                    }
                    className="mt-1"
                  >
                    {kpis?.totalHoursDiff > 0 ? '+' : ''}
                    {kpis?.totalHoursDiff.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <KpiCard
              title={t('dashboard.director.activeProjects')}
              value={kpis?.activeProjects}
              icon={Layers}
              color="blue"
            />
            <KpiCard
              title={t('dashboard.director.activeConsultants')}
              value={kpis?.activeConsultants}
              icon={Users}
              color="indigo"
            />

            {/* Gauge Chart Simulation with Pie */}
            <Card>
              <CardContent className="p-4 relative flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-muted-foreground absolute top-4 left-4">
                  {t('dashboard.director.globalUtilization')}
                </p>
                <div className="h-[100px] w-full mt-4">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { value: kpis?.globalUtilization },
                          { value: 100 - kpis?.globalUtilization },
                        ]}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell
                          fill={
                            kpis?.globalUtilization > 80 ? '#22c55e' : '#3b82f6'
                          }
                        />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="absolute bottom-2 text-2xl font-bold">
                  {kpis?.globalUtilization.toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {t('dashboard.director.approvalRatio')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">
                  {kpis?.approvalRatio.toFixed(1)}%
                </span>
                {kpis?.approvalRatio > 90 ? (
                  <CheckCircle2 className="text-green-500 h-5 w-5" />
                ) : (
                  <Activity className="text-yellow-500 h-5 w-5" />
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {t('dashboard.director.avgHoursConsultant')}
              </span>
              <span className="text-xl font-bold">
                {kpis?.avgHoursConsultant.toFixed(1)}h
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border shadow-sm flex items-center justify-between">
              <span className="text-sm text-slate-500">
                {t('common.status')}
              </span>
              <div className="flex gap-1">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Active
                </Badge>
                <Badge variant="outline" className="bg-slate-50 text-slate-700">
                  All
                </Badge>
              </div>
            </div>
          </div>

          {/* Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('dashboard.director.hoursByWorkFront')}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart
                    data={charts?.workFrontData}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                      radius={[0, 4, 4, 0]}
                      barSize={30}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.director.clientDist')}</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={charts?.clientData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {charts?.clientData.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="vertical"
                      verticalAlign="middle"
                      align="right"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{t('dashboard.director.timeline')}</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={charts?.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="registered"
                      name={t('dashboard.director.registered')}
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="approved"
                      name={t('dashboard.director.approved')}
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Consolidated Table */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">
              {t('dashboard.director.consolidatedTable')}
            </h3>
            <ExecutiveReportTable data={consolidatedTable || []} />
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  const colorClass =
    {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      indigo: 'text-indigo-600 bg-indigo-50',
    }[color as string] || 'text-slate-600 bg-slate-50'

  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={cn('p-3 rounded-full', colorClass)}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  )
}
