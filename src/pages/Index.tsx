import { useState } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntryTable } from '@/components/time-entry-table'
import { MonthlyReport } from '@/components/monthly-report'
import { MonthNavigation } from '@/components/month-navigation'
import { TimeEntry } from '@/lib/types'

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
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Bienvenido de nuevo
        </h2>
        <p className="text-muted-foreground">
          Registra tus actividades diarias y mantén un control preciso de tu
          tiempo por periodos mensuales.
        </p>
      </div>

      <div className="space-y-6">
        {/* Month Navigation Control */}
        <section aria-label="Navegación Mensual">
          <MonthNavigation
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </section>

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

          <div className="lg:col-span-4 space-y-8 sticky top-24">
            <section aria-label="Reporte Mensual">
              <MonthlyReport date={selectedDate} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Index
