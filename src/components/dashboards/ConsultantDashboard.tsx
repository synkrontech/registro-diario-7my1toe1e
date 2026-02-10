import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useDateLocale } from '@/components/LanguageSelector'
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  CalendarDays,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { TimeEntryForm } from '@/components/time-entry-form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

export function ConsultantDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const dateLocale = useDateLocale()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getConsultantMetrics(user.id)
      setData(result)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  if (loading && !data) {
    return (
      <div className="h-96 flex items-center justify-center">Loading...</div>
    )
  }

  const { kpis, dailyTrend, lastEntries } = data || {}

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('common.welcome')}, {user?.user_metadata?.nombre}
          </h1>
          <p className="text-slate-500">
            {format(new Date(), 'PPPP', { locale: dateLocale })}
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t('dashboard.consultant.registeredHours')}
          value={`${kpis?.registeredHours.toFixed(1)} h`}
          icon={Clock}
          color="blue"
        />
        <KpiCard
          title={t('dashboard.consultant.pendingHours')}
          value={`${kpis?.pendingHours.toFixed(1)} h`}
          icon={AlertCircle}
          color="yellow"
        />
        <KpiCard
          title={t('dashboard.consultant.approvedHours')}
          value={`${kpis?.approvedHours.toFixed(1)} h`}
          icon={CheckCircle2}
          color="green"
        />
        <KpiCard
          title={t('timeEntry.rejectedHours')}
          value={`${kpis?.rejectedHours.toFixed(1)} h`}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Daily Trend Chart */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>{t('dashboard.consultant.dailyTrend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ChartContainer
              config={{
                hours: {
                  label: t('common.hours'),
                  color: 'hsl(var(--primary))',
                },
              }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                    className="stroke-indigo-600"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Last 5 Records Table */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader>
          <CardTitle>{t('dashboard.consultant.lastEntries')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('timeEntry.project')}</TableHead>
                <TableHead>{t('timeEntry.date')}</TableHead>
                <TableHead>{t('timeEntry.hours')}</TableHead>
                <TableHead className="text-right">
                  {t('common.status')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lastEntries?.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.project_name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(entry.date), 'dd MMM yyyy', {
                      locale: dateLocale,
                    })}
                  </TableCell>
                  <TableCell>
                    {(entry.durationMinutes / 60).toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge status={entry.status} t={t} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  const colorClass =
    {
      blue: 'text-blue-600 bg-blue-50',
      green: 'text-green-600 bg-green-50',
      yellow: 'text-yellow-600 bg-yellow-50',
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

function StatusBadge({ status, t }: any) {
  const styles = {
    aprobado: 'bg-green-100 text-green-800 border-green-200',
    rechazado: 'bg-red-100 text-red-800 border-red-200',
    pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  }[status as string]

  return (
    <Badge variant="outline" className={cn('capitalize', styles)}>
      {t(`enums.timeEntryStatus.${status}`)}
    </Badge>
  )
}
