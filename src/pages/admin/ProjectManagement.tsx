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
import { ProjectAssignmentModal } from '@/components/admin/ProjectAssignmentModal'
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
import { useTranslation } from 'react-i18next'

export default function ProjectManagement() {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [managers, setManagers] = useState<Partial<UserProfile>[]>([])
  const [consultants, setConsultants] = useState<Partial<UserProfile>[]>([])
  const [systems, setSystems] = useState<System[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Assignment Modal State
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [assigningProject, setAssigningProject] = useState<Project | null>(null)
  const [isSavingAssignment, setIsSavingAssignment] = useState(false)

  const loadData = async () => {
    try {
      const [
        projectsData,
        clientsData,
        managersData,
        systemsData,
        consultantsData,
      ] = await Promise.all([
        projectService.getProjects(),
        clientService.getClients(),
        projectService.getManagers(),
        systemService.getSystems(),
        projectService.getConsultants(),
      ])

      setProjects(projectsData)
      setClients(clientsData)
      setManagers(managersData)
      setSystems(systemsData)
      setConsultants(consultantsData)
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
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
        toast({ title: t('common.updated') })
      } else {
        await projectService.createProject(data)
        toast({ title: t('common.saved') })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await projectService.deleteProject(id)
      toast({ title: t('common.deleted') })
      loadData()
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorDelete'),
        variant: 'destructive',
      })
    }
  }

  const handleAssign = (project: Project) => {
    setAssigningProject(project)
    setIsAssignmentModalOpen(true)
  }

  const handleSaveAssignments = async (
    projectId: string,
    userIds: string[],
  ) => {
    setIsSavingAssignment(true)
    try {
      await projectService.updateProjectAssignments(projectId, userIds)
      toast({ title: t('common.saved') })
      setIsAssignmentModalOpen(false)
      loadData() // Refresh list to update counts
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
        variant: 'destructive',
      })
    } finally {
      setIsSavingAssignment(false)
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
            {t('projects.title')}
          </h2>
          <p className="text-muted-foreground">{t('projects.subtitle')}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> {t('projects.newProject')}
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
          onAssign={handleAssign}
        />
      )}

      {/* Create/Edit Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingProject
                ? t('projects.editProject')
                : t('projects.newProject')}
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

      {/* Assign Consultants Modal */}
      <ProjectAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        project={assigningProject}
        consultants={consultants}
        onSave={handleSaveAssignments}
        isSaving={isSavingAssignment}
      />
    </div>
  )
}
