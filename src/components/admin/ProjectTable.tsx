import { useState } from 'react'
import { Project, Client, UserProfile } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Users,
  UserPlus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'

interface ProjectTableProps {
  projects: Project[]
  clients: Client[]
  managers: Partial<UserProfile>[]
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onAssign: (project: Project) => void
}

export function ProjectTable({
  projects,
  clients,
  managers,
  onEdit,
  onDelete,
  onAssign,
}: ProjectTableProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [managerFilter, setManagerFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.codigo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ? true : project.status === statusFilter
    const matchesClient =
      clientFilter === 'all' ? true : project.client_id === clientFilter
    const matchesManager =
      managerFilter === 'all' ? true : project.gerente_id === managerFilter

    return matchesSearch && matchesStatus && matchesClient && matchesManager
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo':
        return 'bg-emerald-600 hover:bg-emerald-700'
      case 'pausado':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'finalizado':
        return 'bg-slate-500 hover:bg-slate-600'
      default:
        return 'bg-slate-400'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder={t('common.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('enums.projectStatus.all')}</SelectItem>
            <SelectItem value="activo">
              {t('enums.projectStatus.activo')}
            </SelectItem>
            <SelectItem value="pausado">
              {t('enums.projectStatus.pausado')}
            </SelectItem>
            <SelectItem value="finalizado">
              {t('enums.projectStatus.finalizado')}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('timeEntry.client')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('enums.projectStatus.all')}</SelectItem>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={managerFilter} onValueChange={setManagerFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('projects.manager')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('enums.projectStatus.all')}</SelectItem>
            {managers.map((m) => (
              <SelectItem key={m.id} value={m.id!}>
                {m.nombre} {m.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('clients.code')}</TableHead>
              <TableHead>{t('timeEntry.project')}</TableHead>
              <TableHead>{t('timeEntry.client')}</TableHead>
              <TableHead>{t('projects.manager')}</TableHead>
              <TableHead>{t('projects.team')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">
                {t('common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {t('timeEntry.noEntries')}
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-mono text-xs">
                    {project.codigo}
                  </TableCell>
                  <TableCell className="font-medium">
                    {project.nombre}
                  </TableCell>
                  <TableCell>{project.client_name}</TableCell>
                  <TableCell>{project.gerente_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-slate-50">
                        <Users className="mr-1 h-3 w-3 text-slate-500" />
                        {project.consultant_count}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'capitalize',
                        getStatusColor(project.status),
                      )}
                    >
                      {t(`enums.projectStatus.${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                              onClick={() => onAssign(project)}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span className="sr-only">
                                {t('projects.assignTeam')}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('projects.assignTeam')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {t('common.actions')}
                          </DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => onAssign(project)}>
                            <Users className="mr-2 h-4 w-4" />{' '}
                            {t('projects.assignTeam')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(project)}>
                            <Pencil className="mr-2 h-4 w-4" />{' '}
                            {t('common.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setDeleteId(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                            {t('common.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.noCancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId) onDelete(deleteId)
                setDeleteId(null)
              }}
            >
              {t('common.yesDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
