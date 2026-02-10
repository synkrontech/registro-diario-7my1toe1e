import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ProjectReportTableProps {
  entries: any[]
}

export function ProjectReportTable({ entries }: ProjectReportTableProps) {
  const { t } = useTranslation()

  // Group entries by user
  const groupedByUser = entries.reduce(
    (acc, entry) => {
      const userId = entry.user_id
      if (!acc[userId]) {
        acc[userId] = {
          user: entry.users,
          entries: [],
          totalMinutes: 0,
        }
      }
      acc[userId].entries.push(entry)
      acc[userId].totalMinutes += entry.durationminutes
      return acc
    },
    {} as Record<string, { user: any; entries: any[]; totalMinutes: number }>,
  )

  const grandTotalMinutes = entries.reduce(
    (acc, curr) => acc + curr.durationminutes,
    0,
  )
  const grandTotalHours = (grandTotalMinutes / 60).toFixed(2)

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[200px]">
              {t('reports.consultant')}
            </TableHead>
            <TableHead className="w-[120px]">{t('timeEntry.date')}</TableHead>
            <TableHead className="w-[100px] text-right">
              {t('reports.hoursWorked')}
            </TableHead>
            <TableHead>{t('timeEntry.description')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                {t('timeEntry.noEntries')}
              </TableCell>
            </TableRow>
          ) : (
            Object.values(groupedByUser).map((group) => {
              const userHours = (group.totalMinutes / 60).toFixed(2)
              const sortedEntries = group.entries.sort(
                (a, b) =>
                  new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
              )

              return (
                <>
                  <TableRow
                    key={`user-header-${group.user.id}`}
                    className="bg-indigo-50/50"
                  >
                    <TableCell
                      colSpan={4}
                      className="font-bold text-indigo-900"
                    >
                      {group.user.nombre} {group.user.apellido}
                    </TableCell>
                  </TableRow>
                  {sortedEntries.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-muted-foreground pl-8">
                        {/* Indent for hierarchy visual */}
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(entry.fecha), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {(entry.durationminutes / 60).toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {entry.description}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow
                    key={`user-subtotal-${group.user.id}`}
                    className="bg-slate-50 font-medium border-b-2"
                  >
                    <TableCell colSpan={2} className="text-right">
                      {t('reports.consultantSubtotal')}:
                    </TableCell>
                    <TableCell className="text-right text-indigo-700">
                      {userHours}h
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </>
              )
            })
          )}
        </TableBody>
        {entries.length > 0 && (
          <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
            <TableRow>
              <TableCell
                colSpan={2}
                className="text-right font-bold text-indigo-900 text-base"
              >
                {t('reports.totalProjectHours')}
              </TableCell>
              <TableCell className="text-right font-bold text-indigo-700 text-base">
                {grandTotalHours}h
              </TableCell>
              <TableCell />
            </TableRow>
          </tfoot>
        )}
      </Table>
    </div>
  )
}
