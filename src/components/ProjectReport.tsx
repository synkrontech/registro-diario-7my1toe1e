import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Loader2,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  Download,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
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
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { ProjectReportTable } from '@/components/ProjectReportTable'
import { reportService } from '@/services/reportService'
import { clientService } from '@/services/clientService'
import { projectService } from '@/services/projectService'
import { useToast } from '@/hooks/use-toast'
import { downloadProjectReportCsv } from '@/lib/csv-export'
import { useDateLocale } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'

export function ProjectReport() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const dateLocale = useDateLocale()

  // State
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])

  // Filters
  const [selectedClientId, setSelectedClientId] = useState<string>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Report Data
  const [reportData, setReportData] = useState<{
    project: any
    entries: any[]
  } | null>(null)

  useEffect(() => {
    loadFilters()
  }, [])

  useEffect(() => {
    if (selectedClientId === 'all') {
      setFilteredProjects(projects)
    } else {
      setFilteredProjects(
        projects.filter((p) => p.client_id === selectedClientId),
      )
    }
    // Reset project selection if not in new filtered list
    if (selectedProjectId) {
      const exists =
        selectedClientId === 'all' ||
        projects.find(
          (p) => p.id === selectedProjectId && p.client_id === selectedClientId,
        )
      if (!exists) setSelectedProjectId('')
    }
  }, [selectedClientId, projects])

  const loadFilters = async () => {
    setLoadingFilters(true)
    try {
      const [clientsData, projectsData] = await Promise.all([
        clientService.getClients(),
        projectService.getProjects(),
      ])
      setClients(clientsData)
      setProjects(projectsData)
      setFilteredProjects(projectsData)
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
        variant: 'destructive',
      })
    } finally {
      setLoadingFilters(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedProjectId || !dateRange?.from || !dateRange?.to) {
      toast({
        title: t('validation.required'),
        description: t('validation.selectProject'),
        variant: 'destructive',
      })
      return
    }

    setLoadingData(true)
    try {
      const data = await reportService.getProjectReportData(
        selectedProjectId,
        dateRange.from,
        dateRange.to,
      )
      setReportData(data)
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
    if (!reportData || !dateRange?.from || !dateRange?.to) return
    downloadProjectReportCsv(
      reportData.project,
      reportData.entries,
      dateRange.from,
      dateRange.to,
      dateLocale,
    )
  }

  // Chart Data
  const pieChartData = useMemo(() => {
    if (!reportData?.entries.length) return []
    const distribution = reportData.entries.reduce(
      (acc, entry) => {
        const userId = entry.user_id
        if (!acc[userId]) {
          acc[userId] = {
            name: `${entry.users.nombre} ${entry.users.apellido}`,
            value: 0,
            fill: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for simplicity or predefined palette
          }
        }
        acc[userId].value += entry.durationminutes / 60
        return acc
      },
      {} as Record<string, { name: string; value: number; fill: string }>,
    )

    // Normalize values to 2 decimals
    return Object.values(distribution).map((d) => ({
      ...d,
      value: parseFloat(d.value.toFixed(2)),
    }))
  }, [reportData])

  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884d8',
    '#82ca9d',
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filters */}
      <Card className="bg-slate-50/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.filterClient')}
              </label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
                disabled={loadingFilters}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('reports.allClients')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reports.allClients')}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.filterProject')}
              </label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={loadingFilters || filteredProjects.length === 0}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={t('reports.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.dateRange')}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal bg-white',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y', {
                            locale: dateLocale,
                          })}{' '}
                          -{' '}
                          {format(dateRange.to, 'LLL dd, y', {
                            locale: dateLocale,
                          })}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y', {
                          locale: dateLocale,
                        })
                      )
                    ) : (
                      <span>{t('approvals.filters.pickDate')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleGenerate}
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

      {/* Report Data */}
      {reportData && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {reportData.project.nombre}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {reportData.project.codigo} •{' '}
                    {reportData.project.work_front || 'N/A'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('reports.exportExcel')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('clients.title')}</p>
                  <p className="font-medium">
                    {reportData.project.clients?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('systems.title')}</p>
                  <p className="font-medium">
                    {reportData.project.systems?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    {t('projects.manager')}
                  </p>
                  <p className="font-medium">
                    {reportData.project.users
                      ? `${reportData.project.users.nombre} ${reportData.project.users.apellido}`
                      : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">
                  {t('reports.hoursDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {pieChartData.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      {t('timeEntry.noEntries')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <div className="lg:col-span-2">
              <ProjectReportTable entries={reportData.entries} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
