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
import { ManagerProjectStat } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ManagerReportTableProps {
  projects: ManagerProjectStat[]
}

export function ManagerReportTable({ projects }: ManagerReportTableProps) {
  const { t } = useTranslation()

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>{t('projects.project')}</TableHead>
            <TableHead>{t('clients.title')}</TableHead>
            <TableHead>{t('systems.title')}</TableHead>
            <TableHead className="text-right">
              {t('reports.hoursWorked')}
            </TableHead>
            <TableHead className="text-center">
              {t('reports.uniqueConsultants')}
            </TableHead>
            <TableHead className="text-center">
              {t('reports.pendingApprovals')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                {t('timeEntry.noEntries')}
              </TableCell>
            </TableRow>
          ) : (
            projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">
                  {project.nombre}
                  <div className="text-xs text-muted-foreground">
                    {project.codigo}
                  </div>
                </TableCell>
                <TableCell>{project.client_name}</TableCell>
                <TableCell>{project.system_name}</TableCell>
                <TableCell className="text-right font-medium">
                  {project.approvedHours.toFixed(2)}h
                </TableCell>
                <TableCell className="text-center">
                  {project.consultantCount}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={project.pendingCount > 0 ? 'default' : 'secondary'}
                    className={cn(
                      project.pendingCount > 0
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200'
                        : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    {project.pendingCount}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
