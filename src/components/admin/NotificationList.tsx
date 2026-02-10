import { useEffect, useState } from 'react'
import { Notification } from '@/lib/types'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/components/AuthProvider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificationList() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await adminService.getNotifications(user.id)
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
    // In a real app, subscribe to realtime updates here
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleMarkRead = async (id: string) => {
    try {
      await adminService.markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      )
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAllRead = async () => {
    if (!user) return
    try {
      await adminService.markAllNotificationsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (error) {
      console.error(error)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.is_read
    return n.type === filter
  })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notificaciones
          </CardTitle>
          <CardDescription>
            Alertas del sistema y registros de usuarios
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unread">No leídas</SelectItem>
              <SelectItem value="audit">Auditoría</SelectItem>
              <SelectItem value="registration">Registro</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Marcar todo leído
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[600px] px-6">
          <div className="flex flex-col gap-4 py-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">
                Cargando...
              </p>
            ) : filteredNotifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay notificaciones
              </p>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50',
                    !notification.is_read
                      ? 'bg-indigo-50/50 border-indigo-100'
                      : 'bg-background',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {notification.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] px-1.5 py-0 capitalize',
                            notification.type === 'audit'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700',
                          )}
                        >
                          {notification.type}
                        </Badge>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(
                          new Date(notification.created_at),
                          'd MMM HH:mm',
                          { locale: es },
                        )}
                      </span>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMarkRead(notification.id)}
                          title="Marcar como leída"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
