import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { format, subMonths } from 'date-fns'
import { useDateLocale } from '@/components/LanguageSelector'
import {
  Loader2,
  Calendar as CalendarIcon,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { TimeEntryForm } from '@/components/time-entry-form'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

export function ConsultantDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dateLocale = useDateLocale()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getConsultantMetrics(
        user.id,
        selectedDate,
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
  }, [user, selectedDate])

  // Date selection options (Current + 5 months back)
  const dateOptions = Array.from({ length: 6 }, (_, i) =>
    subMonths(new Date(), i),
  )

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  const { kpis, evolutionData, projectData, lastEntries } = data || {}

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('common.welcome')}, {user?.user_metadata?.nombre || 'Usuario'}
          </h1>
          <p className="text-slate-500">
            {format(new Date(), 'PPPP', { locale: dateLocale })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 flex-1 md:flex-none">
                <Plus className="mr-2 h-4 w-4" />{' '}
                {t('dashboard.consultant.newEntry')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <TimeEntryForm
                currentDate={new Date()}
                onDateChange={() => {}}
                onCancelEdit={() => {
                  setIsFormOpen(false)
                  loadData()
                }}
              />
            </DialogContent>
          </Dialog>

          <Link to="/timesheet?tab=calendar">
            <Button variant="outline" className="flex-1 md:flex-none">
              <CalendarIcon className="mr-2 h-4 w-4" />{' '}
              {t('dashboard.consultant.viewCalendar')}
            </Button>
          </Link>

          <Link to="/reports">
            <Button variant="outline" className="flex-1 md:flex-none">
              <PieChartIcon className="mr-2 h-4 w-4" />{' '}
              {t('dashboard.consultant.myReports')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex justify-end">
        <Select
          value={selectedDate.toISOString()}
          onValueChange={(val) => setSelectedDate(new Date(val))}
        >
          <SelectTrigger className="w-[200px] bg-white">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {dateOptions.map((date) => (
              <SelectItem key={date.toISOString()} value={date.toISOString()}>
                {format(date, 'MMMM yyyy', { locale: dateLocale })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('dashboard.consultant.registeredHours')}
          value={`${kpis?.registeredHours.toFixed(1)} h`}
          icon={Clock}
          color="blue"
        />
        <KpiCard
          title={t('dashboard.consultant.approvedHours')}
          value={`${kpis?.approvedHours.toFixed(1)} h`}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          title={t('dashboard.consultant.pendingHours')}
          value={`${kpis?.pendingHours.toFixed(1)} h`}
          icon={TrendingUp}
          color="yellow"
        />
        <KpiCard
          title={t('dashboard.consultant.approvalRate')}
          value={`${kpis?.approvalRate.toFixed(0)}%`}
          icon={FileText}
          color={kpis?.approvalRate >= 80 ? 'green' : 'red'}
          indicator
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.consultant.evolution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer
                config={{
                  pending: {
                    label: t('enums.timeEntryStatus.pendiente'),
                    color: '#fbbf24',
                  },
                  approved: {
                    label: t('enums.timeEntryStatus.aprobado'),
                    color: '#22c55e',
                  },
                  rejected: {
                    label: t('enums.timeEntryStatus.rechazado'),
                    color: '#ef4444',
                  },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={evolutionData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorApproved"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorPending"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#fbbf24"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#fbbf24"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="approved"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorApproved)"
                      stackId="1"
                    />
                    <Area
                      type="monotone"
                      dataKey="pending"
                      stroke="#fbbf24"
                      fillOpacity={1}
                      fill="url(#colorPending)"
                      stackId="1"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.consultant.projectDist')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={projectData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="value"
                      fill="#6366f1"
                      radius={[0, 4, 4, 0]}
                      name={t('common.hours')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Entries */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          {t('dashboard.consultant.lastEntries')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {lastEntries?.map((entry: any) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge
                    variant="outline"
                    className="bg-indigo-50 text-indigo-700 border-indigo-100 truncate max-w-[120px]"
                  >
                    {entry.project_name}
                  </Badge>
                  <StatusBadge status={entry.status} t={t} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(entry.date), 'dd MMM', {
                      locale: dateLocale,
                    })}
                  </p>
                  <p className="text-xs text-slate-500">{entry.client_name}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-xs font-mono">
                    {(entry.durationMinutes / 60).toFixed(1)}h
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 italic border-l-2 border-slate-200 pl-2">
                  {entry.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color, indicator }: any) {
  const colorClass =
    {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
      red: 'text-red-600 bg-red-50',
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

function StatusBadge({ status, t }: any) {
  const styles = {
    aprobado: 'bg-green-100 text-green-800 border-green-200',
    rechazado: 'bg-red-100 text-red-800 border-red-200',
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }[status as string]

  return (
    <Badge
      variant="outline"
      className={cn('text-[10px] px-1.5 py-0 h-5', styles)}
    >
      {t(`enums.timeEntryStatus.${status}`)}
    </Badge>
  )
}
