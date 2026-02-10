import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { dashboardService } from '@/services/dashboardService'
import { useTranslation } from 'react-i18next'
import { startOfMonth, endOfMonth } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Briefcase, Users, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function ManagerDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await dashboardService.getManagerMetrics(
        user.id,
        startOfMonth(new Date()),
        endOfMonth(new Date()),
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
  }, [user])

  if (loading && !data)
    return (
      <div className="h-96 flex items-center justify-center">Loading...</div>
    )

  const { kpis, topConsultants, projectDistribution } = data || {}
  const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6']

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-8 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {t('sidebar.dashboard')}
        </h1>
        <Link to="/admin/approvals">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            {t('dashboard.manager.goToApprovals')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
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
          color="yellow"
        />
        <KpiCard
          title={t('dashboard.manager.monthlyHours')}
          value={`${kpis?.monthlyHours.toFixed(1)} h`}
          icon={Clock}
          color="green"
        />
        <KpiCard
          title={t('dashboard.manager.totalConsultants')}
          value={kpis?.totalConsultants}
          icon={Users}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Consultants Table */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>{t('dashboard.manager.topConsultants')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.consultant')}</TableHead>
                  <TableHead className="w-[100px] text-right">
                    {t('common.hours')}
                  </TableHead>
                  <TableHead className="w-[140px]">
                    {t('common.status')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topConsultants?.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {c.projects.join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {c.hours.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <Progress value={c.percentage} className="h-2" />
                    </TableCell>
                  </TableRow>
                ))}
                {topConsultants?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Project Distribution Chart */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle>{t('dashboard.manager.hoursDist')}</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {projectDistribution?.length > 0 ? (
              <ChartContainer config={{}} className="h-full w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={projectDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {projectDistribution.map((_: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent hideLabel />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
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
