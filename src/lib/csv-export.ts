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
  downloadReportCsv(entries, date, 'Usuario', locale)
}

export const downloadReportCsv = (
  entries: TimeEntry[],
  date: Date,
  consultantName: string,
  locale: Locale,
) => {
  if (!entries.length) return

  const t = i18n.t
  const monthName = format(date, 'MMMM yyyy', { locale })
  const filename = `reporte-${consultantName.replace(/\s+/g, '-')}-${format(date, 'MM-yyyy')}.csv`

  // Metadata rows for "Excel-like" feel
  const metadata = [
    [`${t('reports.title')}`],
    [`${t('reports.reportFor')}: ${consultantName}`],
    [`${t('reports.period')}: ${monthName}`],
    [], // Empty row for spacing
  ]

  const headers = [
    t('timeEntry.date'),
    t('timeEntry.project'),
    t('timeEntry.client'),
    t('timeEntry.system'),
    t('timeEntry.startTime'),
    t('timeEntry.endTime'),
    t('reports.hoursWorked'),
    t('timeEntry.description'),
    t('common.status'),
  ]

  const rows = entries.map((entry) => {
    const hours = (entry.durationMinutes / 60).toFixed(2)
    const status = t(`enums.timeEntryStatus.${entry.status}`)

    return [
      format(entry.date, 'dd/MM/yyyy'),
      entry.project_name,
      entry.client_name || '-',
      entry.system_name || '-',
      entry.startTime,
      entry.endTime,
      hours.replace('.', ','), // Excel often prefers comma for decimals in some locales, but this is debatable. Keeping it simple.
      entry.description,
      status,
    ]
  })

  // Calculate total
  const totalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )
  const totalHours = (totalMinutes / 60).toFixed(2).replace('.', ',')

  const totalRow = [
    '',
    '',
    '',
    '',
    '',
    t('reports.monthlyTotal'),
    totalHours,
    '',
    '',
  ]

  const allRows = [...metadata, headers, ...rows, [], totalRow]

  // Add BOM for Excel utf-8 compatibility
  const BOM = '\uFEFF'
  const csvContent =
    BOM +
    allRows
      .map((row) =>
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
      )
      .join('\n')

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
