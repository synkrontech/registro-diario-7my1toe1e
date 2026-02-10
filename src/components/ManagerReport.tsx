import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  Loader2,
  Download,
  Search,
  Users,
  Briefcase,
  Clock,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { useAuth } from '@/components/AuthProvider'
import { useDateLocale } from '@/components/LanguageSelector'
import { reportService } from '@/services/reportService'
import { projectService } from '@/services/projectService'
import { ManagerReportTable } from '@/components/ManagerReportTable'
import { downloadManagerReportCsv } from '@/lib/csv-export'
import { useToast } from '@/hooks/use-toast'
import { ManagerProjectStat, UserProfile } from '@/lib/types'

export function ManagerReport() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // State
  const [loadingManagers, setLoadingManagers] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [managers, setManagers] = useState<Partial<UserProfile>[]>([])
  const [data, setData] = useState<{
    projects: ManagerProjectStat[]
    stats: {
      activeProjects: number
      totalApprovedHours: number
      avgHoursPerProject: number
    }
  } | null>(null)

  // Filters
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')

  // Available Years
  const years = [currentYear, currentYear - 1]
  const months = Array.from({ length: 12 }, (_, i) => i)

  const isRestricted = profile?.role === 'gerente'

  useEffect(() => {
    loadManagers()
  }, [profile])

  useEffect(() => {
    if (selectedManagerId) {
      loadReportData()
    }
  }, [selectedManagerId, selectedMonth, selectedYear])

  const loadManagers = async () => {
    setLoadingManagers(true)
    try {
      if (isRestricted && profile) {
        setManagers([profile])
        setSelectedManagerId(profile.id)
      } else {
        const data = await projectService.getManagers()
        setManagers(data)
        if (data.length > 0) {
          // If current user is in the list, select them, else select first
          const myself = data.find((u) => u.id === profile?.id)
          setSelectedManagerId(myself ? myself.id! : data[0].id!)
        }
      }
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
        variant: 'destructive',
      })
    } finally {
      setLoadingManagers(false)
    }
  }

  const loadReportData = async () => {
    if (!selectedManagerId) return
    setLoadingData(true)
    try {
      const result = await reportService.getManagerReportData(
        selectedManagerId,
        selectedMonth,
        selectedYear,
      )
      setData(result)
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleExport = () => {
    if (!data || !selectedManagerId) return
    const manager = managers.find((m) => m.id === selectedManagerId)
    const managerName = manager
      ? `${manager.nombre} ${manager.apellido}`
      : 'Manager'
    const date = new Date(selectedYear, selectedMonth)
    downloadManagerReportCsv(
      data.projects,
      data.stats,
      managerName,
      date,
      dateLocale,
    )
  }

  const selectedManagerName = useMemo(() => {
    const m = managers.find((m) => m.id === selectedManagerId)
    return m ? `${m.nombre} ${m.apellido}` : ''
  }, [managers, selectedManagerId])

  const chartData = useMemo(() => {
    if (!data?.projects) return []
    return data.projects
      .filter((p) => p.approvedHours > 0)
      .map((p) => ({
        name: p.nombre,
        hours: parseFloat(p.approvedHours.toFixed(2)),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10) // Top 10 projects
  }, [data])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filters */}
      <Card className="bg-slate-50/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.selectManager')}
              </label>
              <Select
                value={selectedManagerId}
                onValueChange={setSelectedManagerId}
                disabled={loadingManagers || isRestricted}
              >
                <SelectTrigger className="bg-white">
                  {loadingManagers ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 text-slate-400 mr-2" />
                  )}
                  <SelectValue placeholder={t('reports.selectManager')} />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id!}>
                      {m.nombre} {m.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.selectMonth')}
              </label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {format(new Date(2000, m), 'MMMM', {
                        locale: dateLocale,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.selectYear')}
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={loadReportData}
              disabled={loadingData}
            >
              {loadingData ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Activity className="mr-2 h-4 w-4" />
              )}
              {t('reports.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {data && !loadingData && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {selectedManagerName}
              </h3>
              <p className="text-indigo-600 font-medium capitalize">
                {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', {
                  locale: dateLocale,
                })}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={handleExport}
              disabled={data.projects.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('reports.exportExcel')}
            </Button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reports.totalActiveProjects')}
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.activeProjects}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reports.totalApprovedHours')}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.totalApprovedHours.toFixed(2)}h
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('reports.avgHoursPerProject')}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.stats.avgHoursPerProject.toFixed(2)}h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('reports.projectWorkload')}
                </CardTitle>
                <CardDescription>
                  {t('reports.hoursPerProject')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        hours: {
                          label: t('reports.hoursWorked'),
                          color: 'hsl(var(--primary))',
                        },
                      }}
                      className="h-full w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                          />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 10 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="hours"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            name={t('reports.hoursWorked')}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      {t('timeEntry.noEntries')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <div className="lg:col-span-2">
              <ManagerReportTable projects={data.projects} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
