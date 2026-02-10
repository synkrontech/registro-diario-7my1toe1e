import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Outlet } from 'react-router-dom'
import useTimeStore from '@/stores/useTimeStore'

function LayoutContent() {
  const { getTotalHoursToday } = useTimeStore()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50/50">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-800">
              Registro de Tiempos
            </h1>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-slate-900">
                  Usuario Demo
                </span>
                <span className="text-xs text-slate-500">Frontend Dev</span>
              </div>
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarImage
                  src="https://img.usecurling.com/ppl/thumbnail?gender=male"
                  alt="@usuario"
                />
                <AvatarFallback>UD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t bg-background p-4 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© 2024 TimeLog Inc. Todos los derechos reservados.</span>
          <div className="flex items-center gap-2">
            <span>Total Horas Hoy:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {getTotalHoursToday()}
            </span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Layout() {
  return <LayoutContent />
}
