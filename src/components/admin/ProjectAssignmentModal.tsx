import { useState, useEffect } from 'react'
import { Project, UserProfile } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ProjectAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  consultants: Partial<UserProfile>[]
  onSave: (projectId: string, selectedUserIds: string[]) => Promise<void>
  isSaving: boolean
}

export function ProjectAssignmentModal({
  isOpen,
  onClose,
  project,
  consultants,
  onSave,
  isSaving,
}: ProjectAssignmentModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen && project) {
      // Initialize with currently assigned users from the project object
      setSelectedIds(project.assigned_users || [])
      setSearchTerm('')
    }
  }, [isOpen, project])

  const handleToggle = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    )
  }

  const handleSave = () => {
    if (project) {
      onSave(project.id, selectedIds)
    }
  }

  const filteredConsultants = consultants.filter((c) => {
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Asignar Consultores</DialogTitle>
          <DialogDescription>
            Selecciona los consultores que trabajarán en el proyecto{' '}
            <span className="font-semibold text-foreground">
              {project?.nombre}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar consultor..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-md">
            <ScrollArea className="h-[300px] p-4">
              {filteredConsultants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron consultores.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConsultants.map((consultant) => (
                    <div
                      key={consultant.id}
                      className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      <Checkbox
                        id={`user-${consultant.id}`}
                        checked={selectedIds.includes(consultant.id!)}
                        onCheckedChange={() => handleToggle(consultant.id!)}
                      />
                      <Label
                        htmlFor={`user-${consultant.id}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-medium">
                          {consultant.nombre} {consultant.apellido}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {consultant.email}
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
            <span>
              {selectedIds.length} consultor{selectedIds.length !== 1 && 'es'}{' '}
              seleccionado{selectedIds.length !== 1 && 's'}
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => setSelectedIds([])}
            >
              Limpiar selección
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
