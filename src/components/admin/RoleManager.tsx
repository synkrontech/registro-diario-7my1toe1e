import { useState } from 'react'
import { Role, Permission } from '@/lib/types'
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
import { Plus, Pencil } from 'lucide-react'

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
  permissions,
  onSaveRole,
}: RoleManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
              <TableHead className="text-right">Acciones</TableHead>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Editar Rol' : 'Crear Rol'}
            </DialogTitle>
            <DialogDescription>
              Define el nombre y los permisos asociados a este rol.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

            <div className="space-y-2">
              <Label>Permisos</Label>
              <div className="border rounded-md p-4 h-[200px] overflow-y-auto space-y-3">
                {permissions.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={perm.id}
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={perm.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
