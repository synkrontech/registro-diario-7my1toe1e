import { ApprovalTimeEntry } from '@/lib/types'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { useDateLocale } from '@/components/LanguageSelector'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface ApprovalListProps {
  entries: ApprovalTimeEntry[]
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onToggleGroup: (ids: string[]) => void
  onApprove: (ids: string[]) => void
  onReject: (ids: string[]) => void
}

export function ApprovalList({
  entries,
  selectedIds,
  onToggleSelection,
  onToggleGroup,
  onApprove,
  onReject,
}: ApprovalListProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  // Grouping logic: Project -> Consultant
  const groupedData = entries.reduce(
    (acc, entry) => {
      if (!acc[entry.project_id]) {
        acc[entry.project_id] = {
          name: entry.project_name,
          client: entry.client_name,
          consultants: {},
        }
      }
      if (!acc[entry.project_id].consultants[entry.user_id]) {
        acc[entry.project_id].consultants[entry.user_id] = {
          name: entry.user_name,
          email: entry.user_email,
          seed: entry.user_avatar_seed,
          entries: [],
        }
      }
      acc[entry.project_id].consultants[entry.user_id].entries.push(entry)
      return acc
    },
    {} as Record<
      string,
      {
        name: string
        client: string | undefined
        consultants: Record<
          string,
          {
            name: string
            email: string
            seed?: string
            entries: ApprovalTimeEntry[]
          }
        >
      }
    >,
  )

  if (entries.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 rounded-lg border border-dashed">
        <p className="text-muted-foreground">{t('approvals.noPending')}</p>
      </div>
    )
  }

  const getProjectEntryIds = (projectData: any) => {
    let ids: string[] = []
    Object.values(projectData.consultants).forEach((c: any) => {
      ids = [...ids, ...c.entries.map((e: any) => e.id)]
    })
    return ids
  }

  const getConsultantEntryIds = (consultantData: any) => {
    return consultantData.entries.map((e: any) => e.id)
  }

  const isAllSelected = (ids: string[]) => {
    return ids.length > 0 && ids.every((id) => selectedIds.has(id))
  }

  const isPartiallySelected = (ids: string[]) => {
    const selectedCount = ids.filter((id) => selectedIds.has(id)).length
    return selectedCount > 0 && selectedCount < ids.length
  }

  return (
    <Accordion type="multiple" className="w-full space-y-4">
      {Object.entries(groupedData).map(([projectId, project]) => {
        const projectEntryIds = getProjectEntryIds(project)
        const allProjectSelected = isAllSelected(projectEntryIds)
        const partialProjectSelected = isPartiallySelected(projectEntryIds)

        return (
          <AccordionItem
            key={projectId}
            value={projectId}
            className="border rounded-lg bg-white overflow-hidden"
          >
            <div className="flex items-center px-4 py-2 bg-slate-50 border-b gap-4">
              <Checkbox
                checked={
                  allProjectSelected ||
                  (partialProjectSelected && 'indeterminate')
                }
                onCheckedChange={() => onToggleGroup(projectEntryIds)}
                aria-label={t('approvals.selectAllProject', {
                  project: project.name,
                })}
              />
              <AccordionTrigger className="hover:no-underline py-2 flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-2 text-left">
                  <span className="font-semibold text-lg text-slate-800">
                    {project.name}
                  </span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {project.client}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto md:ml-2">
                    {projectEntryIds.length} entries
                  </span>
                </div>
              </AccordionTrigger>
            </div>

            <AccordionContent className="p-0">
              <div className="divide-y">
                {Object.entries(project.consultants).map(
                  ([userId, consultant]) => {
                    const consultantIds = getConsultantEntryIds(consultant)
                    const allConsultantSelected = isAllSelected(consultantIds)
                    const partialConsultantSelected =
                      isPartiallySelected(consultantIds)

                    return (
                      <div key={userId} className="p-4 bg-white">
                        <div className="flex items-center gap-4 mb-3">
                          <Checkbox
                            checked={
                              allConsultantSelected ||
                              (partialConsultantSelected && 'indeterminate')
                            }
                            onCheckedChange={() => onToggleGroup(consultantIds)}
                            aria-label={t('approvals.selectAllConsultant', {
                              name: consultant.name,
                            })}
                          />
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${consultant.seed}`}
                              />
                              <AvatarFallback>
                                {consultant.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm text-slate-900">
                                {consultant.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {consultant.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pl-8">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>{t('timeEntry.date')}</TableHead>
                                <TableHead>{t('approvals.hours')}</TableHead>
                                <TableHead className="w-[50%]">
                                  {t('approvals.activities')}
                                </TableHead>
                                <TableHead className="text-right">
                                  {t('common.actions')}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {consultant.entries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedIds.has(entry.id)}
                                      onCheckedChange={() =>
                                        onToggleSelection(entry.id)
                                      }
                                    />
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {format(entry.date, 'P', {
                                      locale: dateLocale,
                                    })}
                                    <div className="text-xs text-muted-foreground">
                                      {entry.startTime} - {entry.endTime}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {(entry.durationMinutes / 60).toFixed(1)}h
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <p
                                      className="text-sm text-slate-700 line-clamp-2"
                                      title={entry.description}
                                    >
                                      {entry.description}
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                        onClick={() => onApprove([entry.id])}
                                        title={t('approvals.approve')}
                                      >
                                        <Check className="h-4 w-4" />
                                        <span className="sr-only">
                                          {t('approvals.approve')}
                                        </span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        onClick={() => onReject([entry.id])}
                                        title={t('approvals.reject')}
                                      >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">
                                          {t('approvals.reject')}
                                        </span>
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  },
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
