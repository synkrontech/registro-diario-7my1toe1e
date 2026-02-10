import { useState } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntryTable } from '@/components/time-entry-table'
import { MonthlyReport } from '@/components/monthly-report'
import { MonthNavigation } from '@/components/month-navigation'
import { CalendarView } from '@/components/calendar-view'
import { TimeEntry } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { List, Calendar as CalendarIcon } from 'lucide-react'

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    // Switch the view to the entry's month so the user stays in context of the edit
    setSelectedDate(entry.date)
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
          Bienvenido de nuevo
        </h2>
        <p className="text-muted-foreground">
          Registra tus actividades diarias y mantén un control preciso de tu
          tiempo.
        </p>
      </div>

      <div className="space-y-6">
        {/* Month Navigation Control - Global for both views */}
        <section
          aria-label="Navegación Mensual"
          className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur py-2"
        >
          <MonthNavigation
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </section>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Vista Detallada
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Vista Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="list"
            className="animate-fade-in focus-visible:outline-none focus-visible:ring-0"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <section aria-label="Formulario de registro" id="entry-form">
                  <TimeEntryForm
                    currentDate={selectedDate}
                    onDateChange={setSelectedDate}
                    entryToEdit={editingEntry}
                    onCancelEdit={handleCancelEdit}
                  />
                </section>

                <section aria-label="Tabla de registros">
                  <TimeEntryTable date={selectedDate} onEdit={handleEdit} />
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8 sticky top-32">
                <section aria-label="Reporte Mensual">
                  <MonthlyReport date={selectedDate} />
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="calendar"
            className="animate-fade-in focus-visible:outline-none focus-visible:ring-0"
          >
            <CalendarView currentDate={selectedDate} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Index
