import { useEffect, useState } from 'react'
import { System, SystemFormValues } from '@/lib/types'
import { systemService } from '@/services/systemService'
import { SystemTable } from '@/components/admin/SystemTable'
import { SystemForm } from '@/components/admin/SystemForm'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, MonitorSmartphone } from 'lucide-react'

export default function SystemManagement() {
  const { toast } = useToast()
  const [systems, setSystems] = useState<System[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSystem, setEditingSystem] = useState<System | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSystems = async () => {
    try {
      const data = await systemService.getSystems()
      setSystems(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los sistemas',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSystems()
  }, [])

  const handleCreate = () => {
    setEditingSystem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (system: System) => {
    setEditingSystem(system)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: SystemFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingSystem) {
        await systemService.updateSystem(editingSystem.id, data)
        toast({ title: 'Sistema actualizado exitosamente' })
      } else {
        await systemService.createSystem(data)
        toast({ title: 'Sistema creado exitosamente' })
      }
      setIsModalOpen(false)
      loadSystems()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el sistema',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await systemService.deleteSystem(id)
      toast({ title: 'Sistema eliminado' })
      loadSystems()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el sistema',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <MonitorSmartphone className="h-8 w-8 text-indigo-600" />
            Gestión de Sistemas
          </h2>
          <p className="text-muted-foreground">
            Administra el catálogo de sistemas y plataformas de la organización.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Sistema
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <SystemTable
          systems={systems}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingSystem ? 'Editar Sistema' : 'Nuevo Sistema'}
            </DialogTitle>
            <DialogDescription>
              {editingSystem
                ? 'Modifica los datos del sistema existente.'
                : 'Ingresa los datos para registrar un nuevo sistema.'}
            </DialogDescription>
          </DialogHeader>
          <SystemForm
            initialData={editingSystem}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
