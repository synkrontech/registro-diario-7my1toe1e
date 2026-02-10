import {
  Clock,
  PieChart,
  Settings,
  Users,
  Bell,
  Mail,
  Building2,
  MonitorSmartphone,
  Briefcase,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/components/AuthProvider'

export function AppSidebar() {
  const location = useLocation()
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const isDirector = profile?.role === 'director'
  const hasManagementAccess = isAdmin || isDirector

  const items = [
    {
      title: 'Registro Diario',
      url: '/',
      icon: Clock,
      visible: true,
    },
    {
      title: 'Reportes',
      url: '/reports',
      icon: PieChart,
      visible: true,
    },
    {
      title: 'Configuración',
      url: '/settings',
      icon: Settings,
      visible: true,
    },
  ]

  const adminItems = [
    {
      title: 'Usuarios',
      url: '/admin/users',
      icon: Users,
      visible: isAdmin,
    },
    {
      title: 'Clientes',
      url: '/admin/clients',
      icon: Building2,
      visible: hasManagementAccess,
    },
    {
      title: 'Proyectos',
      url: '/admin/projects',
      icon: Briefcase,
      visible: hasManagementAccess,
    },
    {
      title: 'Sistemas',
      url: '/admin/systems',
      icon: MonitorSmartphone,
      visible: hasManagementAccess,
    },
    {
      title: 'Notificaciones',
      url: '/admin/notifications',
      icon: Bell,
      visible: isAdmin,
    },
    {
      title: 'Plantillas de Correo',
      url: '/admin/settings/emails',
      icon: Mail,
      visible: isAdmin,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-indigo-600 text-sidebar-primary-foreground">
                  <Clock className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">TimeLog</span>
                  <span className="">v1.2.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items
                .filter((item) => item.visible)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasManagementAccess && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems
                  .filter((item) => item.visible)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.url}
                        tooltip={item.title}
                      >
                        <Link to={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
