import { useEffect, useState } from 'react'
import {
  Project,
  ProjectFormValues,
  Client,
  System,
  UserProfile,
} from '@/lib/types'
import { projectService } from '@/services/projectService'
import { clientService } from '@/services/clientService'
import { systemService } from '@/services/systemService'
import { ProjectTable } from '@/components/admin/ProjectTable'
import { ProjectForm } from '@/components/admin/ProjectForm'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Briefcase } from 'lucide-react'

export default function ProjectManagement() {
  const { toast } = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [managers, setManagers] = useState<Partial<UserProfile>[]>([])
  const [systems, setSystems] = useState<System[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    try {
      const [projectsData, clientsData, managersData, systemsData] =
        await Promise.all([
          projectService.getProjects(),
          clientService.getClients(),
          projectService.getManagers(),
          systemService.getSystems(),
        ])

      setProjects(projectsData)
      // Filter only active clients/systems for the form dropdowns if strictness is needed,
      // but usually we want to see all in table filters.
      // The form will use filtered lists.
      setClients(clientsData)
      setManagers(managersData)
      setSystems(systemsData)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de proyectos',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = () => {
    setEditingProject(null)
    setIsModalOpen(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, data)
        toast({ title: 'Proyecto actualizado exitosamente' })
      } else {
        await projectService.createProject(data)
        toast({ title: 'Proyecto creado exitosamente' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el proyecto',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await projectService.deleteProject(id)
      toast({ title: 'Proyecto eliminado' })
      loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el proyecto',
        variant: 'destructive',
      })
    }
  }

  // Filter for active entities for the form
  const activeClients = clients.filter((c) => c.activo)
  const activeSystems = systems.filter((s) => s.activo)

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            Gestión de Proyectos
          </h2>
          <p className="text-muted-foreground">
            Administra los proyectos, asignaciones y frentes de trabajo.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <ProjectTable
          projects={projects}
          clients={clients}
          managers={managers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </DialogTitle>
            <DialogDescription>
              {editingProject
                ? 'Modifica los datos del proyecto existente.'
                : 'Ingresa los datos para registrar un nuevo proyecto.'}
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            initialData={editingProject}
            clients={activeClients}
            managers={managers}
            systems={activeSystems}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
