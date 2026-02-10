import { TimeEntry } from '@/lib/types'
import { format } from 'date-fns'
import { Locale } from 'date-fns'

export const downloadMonthlyCsv = (
  entries: TimeEntry[],
  date: Date,
  locale: Locale,
) => {
  if (!entries.length) return

  const monthName = format(date, 'MMMM-yyyy', { locale })
  const filename = `registro-tiempos-${monthName}.csv`

  const headers = [
    'Fecha',
    'Proyecto',
    'Cliente',
    'Sistema',
    'Hora Inicio',
    'Hora Fin',
    'Duración',
    'Descripción',
    'Estado',
  ]

  const rows = entries.map((entry) => {
    const hours = Math.floor(entry.durationMinutes / 60)
    const minutes = entry.durationMinutes % 60
    const durationStr = `${hours}:${minutes.toString().padStart(2, '0')}`

    return [
      format(entry.date, 'yyyy-MM-dd'),
      entry.project_name,
      entry.client_name || '-',
      entry.system_name || '-',
      entry.startTime,
      entry.endTime,
      durationStr,
      entry.description,
      entry.status,
    ]
  })

  // Add BOM for Excel utf-8 compatibility
  const BOM = '\uFEFF'
  const csvContent =
    BOM +
    [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((field) => {
            const stringField = String(field)
            // Escape quotes and wrap in quotes if contains comma, quote or newline
            if (
              stringField.includes(',') ||
              stringField.includes('"') ||
              stringField.includes('\n')
            ) {
              return `"${stringField.replace(/"/g, '""')}"`
            }
            return stringField
          })
          .join(','),
      ),
    ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
