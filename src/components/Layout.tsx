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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function LayoutContent() {
  const { viewDate, getEntriesByMonth } = useTimeStore()

  // Calculate monthly stats for the footer
  const monthlyEntries = getEntriesByMonth(viewDate)
  const totalMinutes = monthlyEntries.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0,
  )
  const totalHours = (totalMinutes / 60).toFixed(1)
  const uniqueProjects = new Set(monthlyEntries.map((e) => e.project)).size

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50/50 flex flex-col h-full min-h-screen">
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
        <footer className="border-t bg-background p-4 text-sm text-muted-foreground shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-20">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <span>© 2024 TimeLog Inc. Todos los derechos reservados.</span>

            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                <span className="font-semibold text-slate-700">
                  Resumen Mensual:
                </span>
                <div className="flex items-center gap-3 text-xs md:text-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Horas:</span>
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {totalHours}h
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Proyectos:</span>
                    <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {uniqueProjects}
                    </span>
                  </div>
                  <Separator
                    orientation="vertical"
                    className="h-4 hidden md:block"
                  />
                  <span className="text-slate-400 capitalize hidden md:block">
                    {format(viewDate, 'MMMM', { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Layout() {
  return <LayoutContent />
}
