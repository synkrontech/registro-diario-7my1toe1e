import { useState } from 'react'
import { TimeEntryForm } from '@/components/time-entry-form'
import { TimeEntryTable } from '@/components/time-entry-table'

const Index = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
        <section aria-label="Formulario de registro">
          <TimeEntryForm onDateChange={setSelectedDate} />
        </section>

        <section aria-label="Tabla de registros">
          <TimeEntryTable date={selectedDate} />
        </section>
      </div>
    </div>
  )
}

export default Index
