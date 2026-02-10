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
import { useTranslation } from 'react-i18next'

export default function UserManagement() {
  const { t } = useTranslation()
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
        toast({ title: t('common.updated') })
      } else {
        // Create User
        const selectedRole = roles.find((r) => r.id === data.role_id)
        await adminService.createUser({
          ...data,
          role: selectedRole?.name || 'consultor',
        })
        toast({ title: t('common.saved') })
      }
      setIsModalOpen(false)
      loadData()
    } catch (error: any) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: error.message || t('common.errorSave'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
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
        toast({ title: t('common.updated') })
      } else {
        await adminService.createRole(user.id, name, description, permissionIds)
        toast({ title: t('common.saved') })
      }
      const [newRoles, newLogs] = await Promise.all([
        adminService.getRoles(),
        adminService.getAuditLogs(),
      ])
      setRoles(newRoles)
      setAuditLogs(newLogs)
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Shield className="h-8 w-8 text-indigo-600" />
          {t('users.title')}
        </h2>
        <p className="text-muted-foreground">{t('users.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-slate-100 p-1">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> {t('sidebar.users')}
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> {t('users.rolesPermissions')}
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> {t('users.audit')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="animate-fade-in">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t('sidebar.users')}</CardTitle>
                  <CardDescription>{t('users.subtitle')}</CardDescription>
                </div>
                <Button
                  onClick={handleCreate}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> {t('users.newUser')}
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
                <CardTitle>{t('users.rolesPermissions')}</CardTitle>
                <CardDescription>{t('users.subtitle')}</CardDescription>
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
                <CardTitle>{t('users.audit')}</CardTitle>
                <CardDescription>{t('users.subtitle')}</CardDescription>
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
              {editingUser ? t('users.editUser') : t('users.newUser')}
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
