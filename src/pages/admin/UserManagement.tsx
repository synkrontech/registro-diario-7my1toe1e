import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Users, Activity, Lock, Plus } from 'lucide-react'
import { UserTable } from '@/components/admin/UserTable'
import { RoleManager } from '@/components/admin/RoleManager'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
import { UserForm } from '@/components/admin/UserForm'
import { adminService } from '@/services/adminService'
import { UserProfile, Role, Permission, AuditLog } from '@/lib/types'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function UserManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, rolesData, permsData, logsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getRoles(),
        adminService.getPermissions(),
        adminService.getAuditLogs(),
      ])

      setUsers(usersData)
      setRoles(rolesData)
      setPermissions(permsData)
      setAuditLogs(logsData)
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de administración',
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
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleUserSubmit = async (data: any) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      if (editingUser) {
        // Update User
        const selectedRole = roles.find((r) => r.id === data.role_id)
        await adminService.updateUser(user.id, editingUser.id, {
          nombre: data.nombre,
          apellido: data.apellido,
          role_id: data.role_id,
          role_name: selectedRole?.name || 'unknown',
          activo: data.activo,
        })
        toast({ title: 'Usuario actualizado exitosamente' })
      } else {
        // Create User
        // Need to pass the role name to the edge function
        const selectedRole = roles.find((r) => r.id === data.role_id)
        await adminService.createUser({
          ...data,
          role: selectedRole?.name || 'consultor',
        })
        toast({ title: 'Usuario creado exitosamente' })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al guardar',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Roles & Permissions Handlers (existing)
  const handleSaveRole = async (
    roleId: string | null,
    name: string,
    description: string,
    permissionIds: string[],
  ) => {
    if (!user) return
    try {
      if (roleId) {
        await adminService.updateRole(
          user.id,
          roleId,
          name,
          description,
          permissionIds,
        )
        toast({ title: 'Rol actualizado' })
      } else {
        await adminService.createRole(user.id, name, description, permissionIds)
        toast({ title: 'Rol creado' })
      }
      // Refresh Data
      const [newRoles, newLogs] = await Promise.all([
        adminService.getRoles(),
        adminService.getAuditLogs(),
      ])
      setRoles(newRoles)
      setAuditLogs(newLogs)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar el rol',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          Administración
        </h2>
        <p className="text-muted-foreground">
          Gestión centralizada de usuarios, roles y seguridad del sistema.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Usuarios
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Roles y Permisos
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Auditoría
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="animate-fade-in">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Usuarios Registrados</CardTitle>
                  <CardDescription>
                    Administra el acceso y roles de los usuarios.
                  </CardDescription>
                </div>
                <Button
                  onClick={handleCreate}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
                </Button>
              </CardHeader>
              <CardContent>
                <UserTable users={users} roles={roles} onEdit={handleEdit} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Roles</CardTitle>
                <CardDescription>
                  Define roles personalizados y sus niveles de acceso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RoleManager
                  roles={roles}
                  permissions={permissions}
                  onSaveRole={handleSaveRole}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Actividad</CardTitle>
                <CardDescription>
                  Registro inmutable de acciones administrativas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditLogViewer logs={auditLogs} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifica los datos del usuario existente.'
                : 'Ingresa los datos para registrar un nuevo usuario.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
            initialData={editingUser}
            roles={roles}
            onSubmit={handleUserSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
