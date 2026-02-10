import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { approvalService } from '@/services/approvalService'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { useDateLocale } from '@/components/LanguageSelector'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Loader2,
  Calendar as CalendarIcon,
  Briefcase,
  Users,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Check,
  X,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function ManagerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dateLocale = useDateLocale()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [expandedProjects, setExpandedProjects] = useState<
    Record<string, boolean>
  >({})

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getManagerMetrics(
        user.id,
        dateRange.from,
        dateRange.to,
      )
      setData(result)
      // Auto expand all projects initially for better visibility
      if (result.pendingTable) {
        const initialExpanded = Object.keys(result.pendingTable).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {},
        )
        setExpandedProjects(initialExpanded)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user, dateRange])

  const handleAction = async (id: string, status: 'aprobado' | 'rechazado') => {
    if (!user) return
    try {
      await approvalService.updateEntryStatus([id], status, user.id)
      toast({ title: t('common.updated'), duration: 2000 })
      // Optimistic update or reload
      loadData()
    } catch (e) {
      toast({ title: t('common.error'), variant: 'destructive' })
    }
  }

  const toggleProject = (project: string) => {
    setExpandedProjects((prev) => ({ ...prev, [project]: !prev[project] }))
  }

  if (loading && !data)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )

  const { kpis, charts, pendingTable } = data || {}
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {t('dashboard.manager.monthlyHours')}
        </h1>

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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('dashboard.manager.assignedProjects')}
          value={kpis?.assignedProjects}
          icon={Briefcase}
          color="blue"
        />
        <KpiCard
          title={t('dashboard.manager.pendingApprovals')}
          value={kpis?.pendingApprovals}
          icon={AlertCircle}
          color={kpis?.pendingApprovals > 10 ? 'red' : 'yellow'}
          badge={kpis?.pendingApprovals > 0}
        />
        <KpiCard
          title={t('dashboard.manager.monthlyHours')}
          value={`${kpis?.monthlyHours.toFixed(1)} h`}
          icon={TrendingUp}
          color="green"
        />
        <KpiCard
          title={t('dashboard.manager.rejectionRate')}
          value={`${kpis?.rejectionRate.toFixed(1)}%`}
          icon={Users}
          color={kpis?.rejectionRate > 10 ? 'red' : 'green'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.manager.weeklyTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer
              config={{
                registered: { label: t('common.active'), color: '#8884d8' },
                approved: { label: t('common.status'), color: '#82ca9d' },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer>
                <LineChart data={charts?.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="registered"
                    stroke="#8884d8"
                    name={t('dashboard.consultant.registeredHours')}
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="#82ca9d"
                    name={t('dashboard.consultant.approvedHours')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.manager.hoursDist')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={charts?.projectDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    label
                  >
                    {charts?.projectDistribution.map(
                      (_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.manager.topConsultants')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer>
                <BarChart
                  data={charts?.topConsultants}
                  layout="vertical"
                  margin={{ left: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="hours"
                    fill="#4f46e5"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('dashboard.manager.pendingApprovals')}</CardTitle>
          <Link to="/admin/approvals">
            <Button variant="link" className="text-indigo-600">
              {t('dashboard.manager.goToApprovals')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {Object.keys(pendingTable || {}).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('approvals.noPending')}
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(pendingTable).map(
                ([project, entries]: [string, any]) => (
                  <div
                    key={project}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div
                      className="bg-slate-50 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => toggleProject(project)}
                    >
                      <h4 className="font-semibold text-slate-800">
                        {project}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{entries.length}</Badge>
                        {expandedProjects[project] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {expandedProjects[project] && (
                      <div className="divide-y">
                        {entries.map((entry: any) => (
                          <div
                            key={entry.id}
                            className="p-3 flex flex-col md:flex-row justify-between items-center gap-4 bg-white"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {entry.consultant}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {format(new Date(entry.date), 'dd/MM/yyyy')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 line-clamp-1">
                                {entry.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="font-mono">
                                {entry.hours.toFixed(1)}h
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() =>
                                    handleAction(entry.id, 'aprobado')
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleAction(entry.id, 'rechazado')
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color, badge }: any) {
  const colorClass =
    {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      red: 'text-red-600 bg-red-50',
    }[color as string] || 'text-slate-600 bg-slate-50'

  return (
    <Card className="relative overflow-hidden">
      {badge && (
        <div className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full m-2 animate-pulse" />
      )}
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
