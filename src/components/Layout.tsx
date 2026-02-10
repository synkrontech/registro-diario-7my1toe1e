import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'
import { LogOut, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useTranslation } from 'react-i18next'

function LayoutContent() {
  const { t } = useTranslation()
  const { profile, signOut } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-slate-50/50 flex flex-col h-full min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold text-slate-800">
              {t('auth.loginTitle')}
            </h1>
            <div className="flex items-center gap-3">
              <LanguageSelector variant="minimal" />

              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-slate-900">
                  {profile
                    ? `${profile.nombre} ${profile.apellido}`
                    : 'Usuario'}
                </span>
                <span className="text-xs text-slate-500 capitalize">
                  {profile
                    ? t(`enums.roles.${profile.role}`, profile.role)
                    : 'Invitado'}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 border border-slate-200 cursor-pointer hover:ring-2 hover:ring-indigo-100 transition-all">
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?gender=male&seed=${profile?.id}`}
                      alt={profile?.nombre}
                    />
                    <AvatarFallback>
                      {profile?.nombre?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('common.myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t('sidebar.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <footer className="border-t bg-background p-4 text-sm text-muted-foreground shadow-[0_-1px_3px_rgba(0,0,0,0.05)] z-20">
          <div className="container mx-auto flex items-center justify-center">
            <span>© 2026 Synkron Tech. Todos los derechos reservados.</span>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Layout() {
  return <LayoutContent />
}
