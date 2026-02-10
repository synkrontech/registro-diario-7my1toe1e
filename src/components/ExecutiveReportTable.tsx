import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { ExecutiveReportItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ExecutiveReportTableProps {
  data: ExecutiveReportItem[]
}

export function ExecutiveReportTable({ data }: ExecutiveReportTableProps) {
  const { t } = useTranslation()

  // 1. Group by Client
  const groupedByClient = data.reduce(
    (acc, item) => {
      const clientId = item.clientId
      if (!acc[clientId]) {
        acc[clientId] = {
          name: item.clientName,
          totalHours: 0,
          systems: {},
        }
      }
      acc[clientId].totalHours += item.totalHours

      // 2. Group by System
      const systemId = item.systemId
      if (!acc[clientId].systems[systemId]) {
        acc[clientId].systems[systemId] = {
          name: item.systemName,
          totalHours: 0,
          projects: [],
        }
      }
      acc[clientId].systems[systemId].totalHours += item.totalHours
      acc[clientId].systems[systemId].projects.push(item)

      return acc
    },
    {} as Record<
      string,
      {
        name: string
        totalHours: number
        systems: Record<
          string,
          {
            name: string
            totalHours: number
            projects: ExecutiveReportItem[]
          }
        >
      }
    >,
  )

  const grandTotal = data.reduce((acc, item) => acc + item.totalHours, 0)

  // Sort Clients
  const sortedClientIds = Object.keys(groupedByClient).sort((a, b) =>
    groupedByClient[a].name.localeCompare(groupedByClient[b].name),
  )

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[30%]">{t('projects.project')}</TableHead>
            <TableHead>{t('projects.manager')}</TableHead>
            <TableHead className="text-right">
              {t('reports.totalApprovedHours')}
            </TableHead>
            <TableHead className="text-center">
              {t('reports.uniqueConsultants')}
            </TableHead>
            <TableHead className="text-right">{t('common.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                {t('timeEntry.noEntries')}
              </TableCell>
            </TableRow>
          ) : (
            sortedClientIds.map((clientId) => {
              const clientGroup = groupedByClient[clientId]
              const sortedSystemIds = Object.keys(clientGroup.systems).sort(
                (a, b) =>
                  clientGroup.systems[a].name.localeCompare(
                    clientGroup.systems[b].name,
                  ),
              )

              return (
                <>
                  {/* Client Header */}
                  <TableRow
                    key={`client-${clientId}`}
                    className="bg-indigo-100 hover:bg-indigo-100/90"
                  >
                    <TableCell
                      colSpan={2}
                      className="font-bold text-indigo-900 text-base"
                    >
                      {clientGroup.name}
                    </TableCell>
                    <TableCell className="text-right font-bold text-indigo-900">
                      {clientGroup.totalHours.toFixed(2)}h
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>

                  {sortedSystemIds.map((systemId) => {
                    const systemGroup = clientGroup.systems[systemId]
                    const sortedProjects = systemGroup.projects.sort((a, b) =>
                      a.projectName.localeCompare(b.projectName),
                    )

                    return (
                      <>
                        {/* System Header */}
                        <TableRow
                          key={`system-${systemId}`}
                          className="bg-indigo-50 hover:bg-indigo-50/90"
                        >
                          <TableCell
                            colSpan={2}
                            className="font-semibold text-indigo-700 pl-8"
                          >
                            {t('systems.title')}: {systemGroup.name}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-indigo-700">
                            {systemGroup.totalHours.toFixed(2)}h
                          </TableCell>
                          <TableCell colSpan={2} />
                        </TableRow>

                        {/* Projects */}
                        {sortedProjects.map((project) => (
                          <TableRow key={project.projectId}>
                            <TableCell className="pl-12">
                              {project.projectName}
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {project.workFront
                                  ? t(`enums.workFront.${project.workFront}`)
                                  : t('enums.workFront.Otro')}
                              </div>
                            </TableCell>
                            <TableCell>{project.managerName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {project.totalHours.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">
                                {project.uniqueConsultants}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn({
                                  'bg-green-100 text-green-800 border-green-200':
                                    project.status === 'activo',
                                  'bg-amber-100 text-amber-800 border-amber-200':
                                    project.status === 'pausado',
                                  'bg-slate-100 text-slate-800 border-slate-200':
                                    project.status === 'finalizado',
                                })}
                              >
                                {t(`enums.projectStatus.${project.status}`)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )
                  })}
                </>
              )
            })
          )}
        </TableBody>
        {data.length > 0 && (
          <tfoot className="bg-slate-900 text-white">
            <TableRow className="hover:bg-slate-900/90">
              <TableCell colSpan={2} className="text-right font-bold text-lg">
                {t('reports.executive.grandTotal')}
              </TableCell>
              <TableCell className="text-right font-bold text-lg">
                {grandTotal.toFixed(2)}h
              </TableCell>
              <TableCell colSpan={2} />
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  )
}
