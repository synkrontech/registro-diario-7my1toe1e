import { TimeEntry, Project, ManagerProjectStat } from '@/lib/types'
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

  generateAndDownloadCsv(allRows, filename)
}

export const downloadProjectReportCsv = (
  project: any,
  entries: any[],
  startDate: Date,
  endDate: Date,
  locale: Locale,
) => {
  if (!entries.length) return

  const t = i18n.t
  const dateRange = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`
  const filename = `reporte-proyecto-${project.codigo}-${format(new Date(), 'yyyyMMdd')}.csv`

  // Metadata
  const metadata = [
    [`${t('reports.projectReportTitle')}`],
    [`${t('projects.project')}: ${project.nombre} (${project.codigo})`],
    [`${t('clients.title')}: ${project.clients?.nombre || '-'}`],
    [`${t('systems.title')}: ${project.systems?.nombre || '-'}`],
    [
      `${t('projects.manager')}: ${project.users ? `${project.users.nombre} ${project.users.apellido}` : '-'}`,
    ],
    [`${t('projects.workFront')}: ${project.work_front || '-'}`],
    [`${t('reports.period')}: ${dateRange}`],
    [],
  ]

  const headers = [
    t('reports.consultant'),
    t('timeEntry.date'),
    t('reports.hoursWorked'),
    t('timeEntry.description'),
  ]

  const rows = entries.map((entry) => {
    const hours = (entry.durationMinutes / 60).toFixed(2)
    const consultantName = entry.users
      ? `${entry.users.nombre} ${entry.users.apellido}`
      : '-'

    return [
      consultantName,
      format(new Date(entry.fecha), 'dd/MM/yyyy'),
      hours.replace('.', ','),
      entry.description,
    ]
  })

  // Calculate total
  const totalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationminutes,
    0,
  )
  const totalHours = (totalMinutes / 60).toFixed(2).replace('.', ',')

  const totalRow = ['', '', t('reports.totalProjectHours'), totalHours]

  const allRows = [...metadata, headers, ...rows, [], totalRow]

  generateAndDownloadCsv(allRows, filename)
}

export const downloadManagerReportCsv = (
  projects: ManagerProjectStat[],
  stats: any,
  managerName: string,
  date: Date,
  locale: Locale,
) => {
  if (!projects.length) return

  const t = i18n.t
  const monthName = format(date, 'MMMM yyyy', { locale })
  const filename = `reporte-gerencial-${managerName.replace(/\s+/g, '-')}-${format(date, 'MM-yyyy')}.csv`

  // Metadata
  const metadata = [
    [`${t('reports.managerReportTitle')}`],
    [`${t('reports.manager')}: ${managerName}`],
    [`${t('reports.period')}: ${monthName}`],
    [],
    [`${t('reports.totalActiveProjects')}: ${stats.activeProjects}`],
    [
      `${t('reports.totalApprovedHours')}: ${stats.totalApprovedHours.toFixed(2).replace('.', ',')}`,
    ],
    [
      `${t('reports.avgHoursPerProject')}: ${stats.avgHoursPerProject.toFixed(2).replace('.', ',')}`,
    ],
    [],
  ]

  const headers = [
    t('projects.project'),
    t('clients.title'),
    t('systems.title'),
    t('reports.hoursWorked'),
    t('reports.pendingApprovals'),
    t('reports.uniqueConsultants'),
    t('common.status'),
  ]

  const rows = projects.map((project) => {
    return [
      project.nombre,
      project.client_name,
      project.system_name,
      project.approvedHours.toFixed(2).replace('.', ','),
      project.pendingCount,
      project.consultantCount,
      t(`enums.projectStatus.${project.status}`),
    ]
  })

  const allRows = [...metadata, headers, ...rows]

  generateAndDownloadCsv(allRows, filename)
}

const generateAndDownloadCsv = (rows: any[][], filename: string) => {
  // Add BOM for Excel utf-8 compatibility
  const csvContent =
    '\uFEFF' +
    rows
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
