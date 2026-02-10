import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase/client'
import { UserProfile, UserRole } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Search, Loader2, Shield } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data as UserProfile[])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los usuarios',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, activo: newStatus } : u)),
    )

    try {
      const { error } = await supabase
        .from('users')
        .update({ activo: newStatus })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Estado actualizado',
        description: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente.`,
      })
    } catch (error: any) {
      // Revert on error
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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
    )

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast({
        title: 'Rol actualizado',
        description: `Rol cambiado a ${newRole} correctamente.`,
      })
    } catch (error: any) {
      // Revert (harder to revert exact previous state without history, so we refetch)
      fetchUsers()
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el rol',
        variant: 'destructive',
      })
    }
  }

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase()
    return (
      user.nombre.toLowerCase().includes(search) ||
      user.apellido.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    )
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-600" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios, roles y permisos de acceso al sistema.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Usuarios Registrados</CardTitle>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No se encontraron usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-slate-200">
                              <AvatarImage
                                src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${user.id}`}
                                alt={user.nombre}
                              />
                              <AvatarFallback>
                                {user.nombre.charAt(0)}
                                {user.apellido.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {user.nombre} {user.apellido}
                              </span>
                              <span className="text-xs text-muted-foreground md:hidden">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={user.role}
                            onValueChange={(val) =>
                              handleRoleChange(user.id, val as UserRole)
                            }
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="consultor">
                                Consultor
                              </SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={user.activo}
                              onCheckedChange={(checked) =>
                                handleStatusChange(user.id, checked)
                              }
                            />
                            <Badge
                              variant={user.activo ? 'default' : 'destructive'}
                              className={
                                user.activo
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : ''
                              }
                            >
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
