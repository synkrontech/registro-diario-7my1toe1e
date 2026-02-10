import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Shield, Users, Activity, Lock } from 'lucide-react'
import { UserTable } from '@/components/admin/UserTable'
import { RoleManager } from '@/components/admin/RoleManager'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
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

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    if (!user) return

    // Optimistic Update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, activo: newStatus } : u)),
    )

    try {
      await adminService.updateUserStatus(user.id, userId, newStatus)
      toast({
        title: 'Estado actualizado',
        description: 'El cambio ha sido notificado al usuario.',
      })
      // Refresh audit logs
      const logs = await adminService.getAuditLogs()
      setAuditLogs(logs)
    } catch (error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, activo: !newStatus } : u)),
      )
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado',
        variant: 'destructive',
      })
    }
  }

  const handleRoleChange = async (userId: string, roleId: string) => {
    if (!user) return

    const roleName = roles.find((r) => r.id === roleId)?.name || 'unknown'
    const oldRole = users.find((u) => u.id === userId)?.role_id

    // Optimistic
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role_id: roleId, role: roleName } : u,
      ),
    )

    try {
      await adminService.updateUserRole(user.id, userId, roleId, roleName)
      toast({ title: 'Rol actualizado' })
      const logs = await adminService.getAuditLogs()
      setAuditLogs(logs)
    } catch (error) {
      // Revert
      if (oldRole) {
        const oldRoleName =
          roles.find((r) => r.id === oldRole)?.name || 'unknown'
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, role_id: oldRole, role: oldRoleName } : u,
          ),
        )
      }
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el rol',
        variant: 'destructive',
      })
    }
  }

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
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>
                  Administra el acceso y roles de los usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={users}
                  roles={roles}
                  onStatusChange={handleStatusChange}
                  onRoleChange={handleRoleChange}
                />
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
    </div>
  )
}
