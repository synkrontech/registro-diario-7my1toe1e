import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  Loader2,
  Calendar as CalendarIcon,
  BarChart as BarChartIcon,
  Download,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart'
import { MultiSelect, Option } from '@/components/ui/multi-select'
import { ExecutiveReportTable } from '@/components/ExecutiveReportTable'
import { reportService } from '@/services/reportService'
import { clientService } from '@/services/clientService'
import { systemService } from '@/services/systemService'
import { useToast } from '@/hooks/use-toast'
import { downloadExecutiveReportCsv } from '@/lib/csv-export'
import { useDateLocale } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'
import { ExecutiveReportItem } from '@/lib/types'

export function ExecutiveReport() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const dateLocale = useDateLocale()

  // State
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Filters Options
  const [clientOptions, setClientOptions] = useState<Option[]>([])
  const [systemOptions, setSystemOptions] = useState<Option[]>([])
  const workFrontOptions = [
    { label: t('enums.workFront.Procesos'), value: 'Procesos' },
    { label: t('enums.workFront.SAP IBP'), value: 'SAP IBP' },
    { label: t('enums.workFront.SAP MDG'), value: 'SAP MDG' },
    { label: t('enums.workFront.Otro'), value: 'Otro' },
  ]

  // Selected Filters
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([])
  const [selectedWorkFront, setSelectedWorkFront] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })

  // Report Data
  const [reportData, setReportData] = useState<ExecutiveReportItem[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    setLoadingFilters(true)
    try {
      const [clientsData, systemsData] = await Promise.all([
        clientService.getClients(),
        systemService.getSystems(),
      ])
      setClientOptions(
        clientsData.map((c) => ({ label: c.nombre, value: c.id })),
      )
      setSystemOptions(
        systemsData.map((s) => ({ label: s.nombre, value: s.id })),
      )
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
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: t('validation.required'),
        description: t('reports.dateRange'),
        variant: 'destructive',
      })
      return
    }

    setLoadingData(true)
    setHasGenerated(true)
    try {
      const data = await reportService.getExecutiveReportData({
        clientIds: selectedClientIds,
        systemIds: selectedSystemIds,
        workFront: selectedWorkFront === 'all' ? null : selectedWorkFront,
        startDate: dateRange.from,
        endDate: dateRange.to,
      })
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
    if (!reportData.length || !dateRange?.from || !dateRange?.to) return
    downloadExecutiveReportCsv(
      reportData,
      dateRange.from,
      dateRange.to,
      dateLocale,
    )
  }

  // Analytics Data
  const workFrontChartData = useMemo(() => {
    const distribution = reportData.reduce(
      (acc, item) => {
        const wf = item.workFront || 'Otro'
        const label = t(`enums.workFront.${wf}`) || wf
        if (!acc[label]) acc[label] = 0
        acc[label] += item.totalHours
        return acc
      },
      {} as Record<string, number>,
    )
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }))
  }, [reportData, t])

  const clientChartData = useMemo(() => {
    const distribution = reportData.reduce(
      (acc, item) => {
        const client = item.clientName
        if (!acc[client]) acc[client] = 0
        acc[client] += item.totalHours
        return acc
      },
      {} as Record<string, number>,
    )
    // Sort and take top 10
    return Object.entries(distribution)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [reportData])

  const PIE_COLORS = [
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.executive.filterClients')}
              </label>
              <MultiSelect
                options={clientOptions}
                selected={selectedClientIds}
                onChange={setSelectedClientIds}
                placeholder={t('reports.executive.selectClients')}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.executive.filterSystems')}
              </label>
              <MultiSelect
                options={systemOptions}
                selected={selectedSystemIds}
                onChange={setSelectedSystemIds}
                placeholder={t('reports.executive.selectSystems')}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('reports.executive.filterWorkFront')}
              </label>
              <Select
                value={selectedWorkFront}
                onValueChange={setSelectedWorkFront}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue
                    placeholder={t('reports.executive.selectWorkFront')}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {workFrontOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
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
                          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
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
              disabled={loadingData || loadingFilters}
            >
              {loadingData ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChartIcon className="mr-2 h-4 w-4" />
              )}
              {t('reports.generate')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {hasGenerated && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-slate-800">
              {t('reports.executiveReportTitle')}
            </h3>
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50"
              onClick={handleExport}
              disabled={reportData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('reports.exportExcel')}
            </Button>
          </div>

          {/* Visual Analytics */}
          {reportData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Work Front Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('reports.executive.workFrontDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ChartContainer config={{}} className="h-full w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={workFrontChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {workFrontChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
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
                  </div>
                </CardContent>
              </Card>

              {/* Client Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t('reports.executive.clientDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
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
                          data={clientChartData}
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
                            dataKey="value"
                            fill="hsl(var(--primary))"
                            radius={[0, 4, 4, 0]}
                            name={t('reports.hoursWorked')}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Table */}
          <ExecutiveReportTable data={reportData} />
        </div>
      )}
    </div>
  )
}
