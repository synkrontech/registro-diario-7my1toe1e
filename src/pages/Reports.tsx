import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import {
  PieChart as PieChartIcon,
  Loader2,
  Download,
  Search,
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
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useAuth } from '@/components/AuthProvider'
import { UserProfile, TimeEntry } from '@/lib/types'
import { useDateLocale } from '@/components/LanguageSelector'
import { reportService } from '@/services/reportService'
import { ReportTable } from '@/components/ReportTable'
import { downloadReportCsv } from '@/lib/csv-export'
import { useToast } from '@/hooks/use-toast'

export default function Reports() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // State
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])

  // Filters
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Available Years (Current and Previous)
  const years = [currentYear, currentYear - 1]
  const months = Array.from({ length: 12 }, (_, i) => i)

  useEffect(() => {
    if (user && profile) {
      loadUsers()
    }
  }, [user, profile])

  useEffect(() => {
    if (selectedUserId) {
      loadReportData()
    }
  }, [selectedUserId, selectedMonth, selectedYear])

  const loadUsers = async () => {
    if (!user || !profile) return
    setLoadingUsers(true)
    try {
      const data = await reportService.getReportUsers(user.id, profile.role)
      setUsers(data)
      // Default to current user if available in list, otherwise first one
      if (data.length > 0) {
        const myself = data.find((u) => u.id === user.id)
        setSelectedUserId(myself ? myself.id : data[0].id)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
        variant: 'destructive',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const loadReportData = async () => {
    if (!selectedUserId) return
    setLoadingData(true)
    try {
      const data = await reportService.getReportData(
        selectedUserId,
        selectedMonth,
        selectedYear,
      )
      setEntries(data)
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
    if (entries.length === 0) return
    const selectedUser = users.find((u) => u.id === selectedUserId)
    const userName = selectedUser
      ? `${selectedUser.nombre} ${selectedUser.apellido}`
      : 'Usuario'
    const date = new Date(selectedYear, selectedMonth)
    downloadReportCsv(entries, date, userName, dateLocale)
  }

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (entries.length === 0) return []
    const start = startOfMonth(new Date(selectedYear, selectedMonth))
    const end = endOfMonth(new Date(selectedYear, selectedMonth))
    const days = eachDayOfInterval({ start, end })

    return days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayEntries = entries.filter(
        (e) => format(e.date, 'yyyy-MM-dd') === dayStr,
      )
      const hours = dayEntries.reduce(
        (acc, curr) => acc + curr.durationMinutes / 60,
        0,
      )
      return {
        day: format(day, 'd'),
        fullDate: format(day, 'P', { locale: dateLocale }),
        hours: parseFloat(hours.toFixed(2)),
      }
    })
  }, [entries, selectedMonth, selectedYear, dateLocale])

  const selectedUserName = useMemo(() => {
    const u = users.find((u) => u.id === selectedUserId)
    return u ? `${u.nombre} ${u.apellido}` : ''
  }, [users, selectedUserId])

  const chartConfig = {
    hours: {
      label: t('reports.hoursWorked'),
      color: 'hsl(var(--primary))',
    },
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <PieChartIcon className="h-8 w-8 text-indigo-600" />
          {t('reports.title')}
        </h2>
        <p className="text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      {/* Filters Card */}
      <Card className="bg-slate-50/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.selectUser')}
              </label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                disabled={loadingUsers || users.length <= 1}
              >
                <SelectTrigger className="bg-white">
                  {loadingUsers ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 text-slate-400 mr-2" />
                  )}
                  <SelectValue placeholder={t('reports.selectUser')} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
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
                <PieChartIcon className="mr-2 h-4 w-4" />
              )}
              {t('reports.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {selectedUserId && !loadingData && (
        <div className="space-y-8 animate-fade-in">
          {/* Report Header Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800">
                {selectedUserName}
              </h3>
              <p className="text-indigo-600 font-medium capitalize">
                {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', {
                  locale: dateLocale,
                })}
              </p>
            </div>
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
              onClick={handleExport}
              disabled={entries.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('reports.exportExcel')}
            </Button>
          </div>

          {/* Chart */}
          {entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('reports.dailyDistribution')}</CardTitle>
                <CardDescription>
                  {t('reports.hoursWorked')} ({t('reports.dayOfMonth')})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ChartContainer
                    config={chartConfig}
                    className="h-full w-full"
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                      />
                      <Bar
                        dataKey="hours"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        name={t('reports.hoursWorked')}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Table */}
          <ReportTable entries={entries} />
        </div>
      )}
    </div>
  )
}
