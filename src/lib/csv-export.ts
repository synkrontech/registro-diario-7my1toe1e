import { TimeEntry } from '@/lib/types'
import { format } from 'date-fns'
import { Locale } from 'date-fns'
import i18n from '@/lib/i18n'

export const downloadMonthlyCsv = (
  entries: TimeEntry[],
  date: Date,
  locale: Locale,
) => {
  if (!entries.length) return

  const t = i18n.t
  const monthName = format(date, 'MMMM-yyyy', { locale })
  const filename = `registro-tiempos-${monthName}.csv`

  const headers = [
    t('timeEntry.date'),
    t('timeEntry.project'),
    t('timeEntry.client'),
    t('timeEntry.system'),
    t('timeEntry.startTime'),
    t('timeEntry.endTime'),
    t('timeEntry.duration'),
    t('timeEntry.description'),
    t('common.status'),
  ]

  const rows = entries.map((entry) => {
    const hours = Math.floor(entry.durationMinutes / 60)
    const minutes = entry.durationMinutes % 60
    const durationStr = `${hours}:${minutes.toString().padStart(2, '0')}`
    const status = t(`enums.timeEntryStatus.${entry.status}`)

    return [
      format(entry.date, 'yyyy-MM-dd'),
      entry.project_name,
      entry.client_name || '-',
      entry.system_name || '-',
      entry.startTime,
      entry.endTime,
      durationStr,
      entry.description,
      status,
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
