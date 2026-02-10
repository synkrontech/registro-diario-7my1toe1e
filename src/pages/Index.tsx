import { useState } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntryTable } from '@/components/time-entry-table'
import { ConsultantStats } from '@/components/consultant-stats'
import { MonthlyReport } from '@/components/monthly-report'
import { MonthNavigation } from '@/components/month-navigation'
import { CalendarView } from '@/components/calendar-view'
import { TimeEntry, TimeEntryStatus } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { List, Calendar as CalendarIcon, Filter } from 'lucide-react'
import useTimeStore from '@/stores/useTimeStore'
import { useTranslation } from 'react-i18next'

const Index = () => {
  const { t } = useTranslation()
  const { viewDate, setViewDate, statusFilter, setStatusFilter } =
    useTimeStore()
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    // Switch the view to the entry's month so the user stays in context of the edit
    setViewDate(entry.date)
    // Scroll to form
    const formElement = document.getElementById('entry-form')
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t('common.welcome')}
        </h2>
        <p className="text-muted-foreground">{t('common.welcomeSubtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Month Navigation Control - Global for both views */}
        <section
          aria-label="Navegación Mensual"
          className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur py-2"
        >
          <MonthNavigation currentDate={viewDate} onDateChange={setViewDate} />
        </section>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <Tabs defaultValue="list" className="w-full md:w-auto">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                {t('timeEntry.detailedView')}
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {t('timeEntry.calendarView')}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="list"
              className="mt-6 animate-fade-in focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                  <section aria-label="Formulario de registro" id="entry-form">
                    <TimeEntryForm
                      currentDate={viewDate}
                      onDateChange={setViewDate}
                      entryToEdit={editingEntry}
                      onCancelEdit={handleCancelEdit}
                    />
                  </section>

                  <section
                    aria-label="Filtro y Tabla de registros"
                    className="space-y-4"
                  >
                    <div className="flex justify-end">
                      <Select
                        value={statusFilter}
                        onValueChange={(val) =>
                          setStatusFilter(val as TimeEntryStatus | 'all')
                        }
                      >
                        <SelectTrigger className="w-[180px] bg-white">
                          <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue
                            placeholder={t('timeEntry.filterByStatus')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.all')}</SelectItem>
                          <SelectItem value="pendiente">
                            {t('enums.timeEntryStatus.pendiente')}
                          </SelectItem>
                          <SelectItem value="aprobado">
                            {t('enums.timeEntryStatus.aprobado')}
                          </SelectItem>
                          <SelectItem value="rechazado">
                            {t('enums.timeEntryStatus.rechazado')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <TimeEntryTable date={viewDate} onEdit={handleEdit} />
                  </section>
                </div>

                <div className="lg:col-span-4 space-y-8 sticky top-32">
                  <section aria-label="Estadísticas de Consultor">
                    <ConsultantStats date={viewDate} />
                  </section>

                  <section aria-label="Reporte Mensual">
                    <MonthlyReport date={viewDate} />
                  </section>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="calendar"
              className="mt-6 animate-fade-in focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Select
                    value={statusFilter}
                    onValueChange={(val) =>
                      setStatusFilter(val as TimeEntryStatus | 'all')
                    }
                  >
                    <SelectTrigger className="w-[180px] bg-white">
                      <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue
                        placeholder={t('timeEntry.filterByStatus')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="pendiente">
                        {t('enums.timeEntryStatus.pendiente')}
                      </SelectItem>
                      <SelectItem value="aprobado">
                        {t('enums.timeEntryStatus.aprobado')}
                      </SelectItem>
                      <SelectItem value="rechazado">
                        {t('enums.timeEntryStatus.rechazado')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CalendarView currentDate={viewDate} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Index
