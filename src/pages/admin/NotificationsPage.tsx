import { NotificationList } from '@/components/admin/NotificationList'

export default function NotificationsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Centro de Notificaciones
        </h2>
        <p className="text-muted-foreground">
          Gestión centralizada de alertas y avisos del sistema.
        </p>
      </div>

      <NotificationList />
    </div>
  )
}
