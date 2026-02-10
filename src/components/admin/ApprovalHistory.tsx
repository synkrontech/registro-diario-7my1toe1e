import { ApprovalTimeEntry } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useDateLocale } from '@/components/LanguageSelector'

interface ApprovalHistoryProps {
  entries: ApprovalTimeEntry[]
}

export function ApprovalHistory({ entries }: ApprovalHistoryProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  if (entries.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          {t('approvals.historyTable.noHistory')}
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>{t('approvals.consultant')}</TableHead>
            <TableHead>{t('approvals.project')}</TableHead>
            <TableHead>{t('timeEntry.date')}</TableHead>
            <TableHead>{t('approvals.activities')}</TableHead>
            <TableHead>{t('approvals.historyTable.finalStatus')}</TableHead>
            <TableHead>{t('approvals.historyTable.processedBy')}</TableHead>
            <TableHead className="text-right">
              {t('approvals.historyTable.actionDate')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="hover:bg-slate-50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${entry.user_avatar_seed}`}
                    />
                    <AvatarFallback>{entry.user_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {entry.user_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.user_email}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">
                    {entry.project_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.client_name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {format(entry.date, 'P', { locale: dateLocale })}
                <div className="text-xs text-muted-foreground">
                  {(entry.durationMinutes / 60).toFixed(1)}h
                </div>
              </TableCell>
              <TableCell>
                <p
                  className="text-sm text-slate-700 line-clamp-2 max-w-[250px]"
                  title={entry.description}
                >
                  {entry.description}
                </p>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    entry.status === 'aprobado' ? 'default' : 'destructive'
                  }
                  className={
                    entry.status === 'aprobado'
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }
                >
                  {t(`enums.timeEntryStatus.${entry.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.processed_by_name ? (
                  <span className="text-sm text-slate-700">
                    {entry.processed_by_name}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                {entry.processed_at ? (
                  <span className="text-sm text-slate-700">
                    {format(new Date(entry.processed_at), 'Pp', {
                      locale: dateLocale,
                    })}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
