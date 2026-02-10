import { useEffect, useState } from 'react'
import { Client, ClientFormValues } from '@/lib/types'
import { clientService } from '@/services/clientService'
import { ClientTable } from '@/components/admin/ClientTable'
import { ClientForm } from '@/components/admin/ClientForm'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Plus, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function ClientManagement() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data)
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clientes',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  const handleCreate = () => {
    setEditingClient(null)
    setIsModalOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsModalOpen(true)
  }

  const handleSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true)
    try {
      if (editingClient) {
        await clientService.updateClient(editingClient.id, data)
        toast({ title: 'Cliente actualizado exitosamente' })
      } else {
        await clientService.createClient(data)
        toast({ title: 'Cliente creado exitosamente' })
      }
      setIsModalOpen(false)
      loadClients()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Ocurrió un error al guardar el cliente',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await clientService.deleteClient(id)
      toast({ title: 'Cliente eliminado' })
      loadClients()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el cliente',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-indigo-600" />
            {t('clients.title')}
          </h2>
          <p className="text-muted-foreground">{t('clients.subtitle')}</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> {t('clients.newClient')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <ClientTable
          clients={clients}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t('clients.editClient') : t('clients.newClient')}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Modifica los datos del cliente existente.'
                : 'Ingresa los datos para registrar un nuevo cliente.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            initialData={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
