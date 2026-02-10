import { useState, useEffect } from 'react'
import { Role, Permission, Project, Client } from '@/lib/types'
import { adminService } from '@/services/adminService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'

interface RoleManagerProps {
  roles: Role[]
  permissions: Permission[]
  onSaveRole: (
    roleId: string | null,
    name: string,
    description: string,
    permissions: string[],
  ) => Promise<void>
}

export function RoleManager({
  roles,
  permissions: initialPermissions,
  onSaveRole,
}: RoleManagerProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()

  const [isOpen, setIsOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Granular Permissions State
  const [allPermissions, setAllPermissions] =
    useState<Permission[]>(initialPermissions)
  const [projects, setProjects] = useState<Partial<Project>[]>([])
  const [clients, setClients] = useState<Partial<Client>[]>([])

  const [newPermCode, setNewPermCode] = useState('view_project')
  const [newPermResourceType, setNewPermResourceType] = useState('project')
  const [newPermResourceId, setNewPermResourceId] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadResources()
    }
  }, [isOpen])

  // Reload permissions when props change
  useEffect(() => {
    setAllPermissions(initialPermissions)
  }, [initialPermissions])

  const loadResources = async () => {
    try {
      const [p, c] = await Promise.all([
        adminService.getProjects(),
        adminService.getClients(),
      ])
      setProjects(p)
      setClients(c)
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpen = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setName(role.name)
      setDescription(role.description || '')
      setSelectedPermissions(role.permissions?.map((p) => p.id) || [])
    } else {
      setEditingRole(null)
      setName('')
      setDescription('')
      setSelectedPermissions([])
    }
    setIsOpen(true)
  }

  const handleSave = async () => {
    if (!name) return
    setIsLoading(true)
    try {
      await onSaveRole(
        editingRole?.id || null,
        name,
        description,
        selectedPermissions,
      )
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const handleCreateGranular = async () => {
    if (!user || !newPermResourceId) return
    try {
      const newPerm = await adminService.createGranularPermission(
        user.id,
        newPermCode,
        `Permiso granular: ${newPermCode} en ${newPermResourceType}`,
        newPermResourceType,
        newPermResourceId,
      )

      setAllPermissions((prev) => [...prev, newPerm])
      setSelectedPermissions((prev) => [...prev, newPerm.id])
      toast({ title: 'Permiso granular creado y seleccionado' })
    } catch (error) {
      toast({ title: 'Error al crear permiso', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => handleOpen()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Crear Nuevo Rol
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead className="text-right">
                {t('common.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium capitalize">
                  {role.name}
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">
                    {role.permissions?.length || 0} asignados
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpen(role)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Crear Rol'}
            </DialogTitle>
            <DialogDescription>
              Define el nombre y los permisos asociados a este rol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Rol</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej. Auditor"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción breve..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permisos Globales</Label>
              <div className="border rounded-md p-4 h-[200px] overflow-y-auto space-y-3 bg-slate-50">
                {allPermissions
                  .filter((p) => !p.resource_id)
                  .map((perm) => (
                    <div key={perm.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={perm.id}
                        checked={selectedPermissions.includes(perm.id)}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={perm.id}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {perm.code}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {perm.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-4 border rounded-md p-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                <h4 className="font-semibold text-sm">
                  Permisos Granulares (Recursos Específicos)
                </h4>
              </div>

              <div className="flex gap-2 items-end">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Acción</Label>
                  <Select value={newPermCode} onValueChange={setNewPermCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view_project">Ver Proyecto</SelectItem>
                      <SelectItem value="edit_project">
                        Editar Proyecto
                      </SelectItem>
                      <SelectItem value="view_client">Ver Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={newPermResourceType}
                    onValueChange={setNewPermResourceType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Proyecto</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 flex-[2]">
                  <Label className="text-xs">Recurso</Label>
                  <Select
                    value={newPermResourceId}
                    onValueChange={setNewPermResourceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {newPermResourceType === 'project' &&
                        projects.map((p) => (
                          <SelectItem key={p.id} value={p.id!}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      {newPermResourceType === 'client' &&
                        clients.map((c) => (
                          <SelectItem key={c.id} value={c.id!}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="secondary" onClick={handleCreateGranular}>
                  Agregar
                </Button>
              </div>

              <div className="space-y-2 mt-4">
                <Label>Permisos Asignados Específicos</Label>
                <div className="max-h-[100px] overflow-y-auto space-y-2">
                  {allPermissions
                    .filter(
                      (p) =>
                        p.resource_id && selectedPermissions.includes(p.id),
                    )
                    .map((perm) => (
                      <div
                        key={perm.id}
                        className="flex items-center justify-between text-sm bg-white p-2 rounded border"
                      >
                        <span>
                          {perm.code}{' '}
                          <span className="text-muted-foreground">en</span>{' '}
                          {perm.resource_type}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500"
                          onClick={() => togglePermission(perm.id)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  {allPermissions.filter(
                    (p) => p.resource_id && selectedPermissions.includes(p.id),
                  ).length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No hay permisos específicos asignados.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
