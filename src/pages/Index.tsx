import { useState } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntryTable } from '@/components/time-entry-table'
import { MonthlyReport } from '@/components/monthly-report'
import { TimeEntry } from '@/lib/types'

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry)
    // The form will update the date if needed, which will update selectedDate via onDateChange
    // But we might want to ensure the view switches to the entry's date immediately for UX
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
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Bienvenido de nuevo
        </h2>
        <p className="text-muted-foreground">
          Registra tus actividades diarias y mantén un control preciso de tu
          tiempo.
        </p>
      </div>

      <div className="space-y-8">
        <section aria-label="Formulario de registro" id="entry-form">
          <TimeEntryForm
            onDateChange={setSelectedDate}
            entryToEdit={editingEntry}
            onCancelEdit={handleCancelEdit}
          />
        </section>

        <section aria-label="Reporte Mensual">
          <MonthlyReport date={selectedDate} />
        </section>

        <section aria-label="Tabla de registros">
          <TimeEntryTable date={selectedDate} onEdit={handleEdit} />
        </section>
      </div>
    </div>
  )
}

export default Index
