import { z } from 'zod'
import { DateRange } from 'react-day-picker'

// Simplified UserRole for backward compatibility in code, but now essentially string
export type UserRole = string
export type ProjectStatus = 'activo' | 'pausado' | 'finalizado'
export type TimeEntryStatus = 'pendiente' | 'aprobado' | 'rechazado'
export type WorkFront = 'Procesos' | 'SAP IBP' | 'SAP MDG' | 'Otro'

export interface Permission {
  id: string
  code: string
  description: string
  resource_id?: string | null
  resource_type?: 'project' | 'client' | null
}

export interface Role {
  id: string
  name: string
  description: string
  permissions?: Permission[]
}

export interface UserPermission {
  code: string
  resourceId?: string
  resourceType?: string
}

export interface UserProfile {
  id: string
  email: string
  nombre: string
  apellido: string
  role: string // Role Name
  role_id: string
  activo: boolean
  created_at?: string
  permissions?: UserPermission[] // Updated to support granular permissions
}

export interface Client {
  id: string
  nombre: string
  codigo: string
  pais: string
  activo: boolean
  created_at?: string
}

export interface System {
  id: string
  nombre: string
  codigo: string
  descripcion?: string | null
  activo: boolean
}

export interface Project {
  id: string
  nombre: string
  codigo: string
  client_id: string
  gerente_id?: string
  system_id?: string
  status: ProjectStatus
  work_front?: string | null
  // Joined fields for UI convenience
  client_name?: string
  system_name?: string
  gerente_name?: string
  consultant_count?: number
  assigned_users?: string[]
}

export interface ManagerProjectStat extends Project {
  approvedHours: number
  pendingCount: number
  consultantCount: number
}

export interface ExecutiveReportItem {
  projectId: string
  projectName: string
  managerName: string
  clientId: string
  clientName: string
  systemId: string
  systemName: string
  workFront: string | null
  status: ProjectStatus
  totalHours: number
  uniqueConsultants: number
}

export interface ProjectAssignment {
  id: string
  project_id: string
  user_id: string
}

export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  date: Date
  startTime: string
  endTime: string
  description: string
  durationMinutes: number
  status: TimeEntryStatus
  processed_by?: string | null
  processed_at?: string | null
  // For UI display
  project_name: string
  client_name?: string
  system_name?: string
}

export interface ApprovalTimeEntry extends TimeEntry {
  user_name: string
  user_email: string
  user_avatar_seed?: string
  processed_by_name?: string
}

export interface AuditLog {
  id: string
  admin_id: string
  action_type: string
  target_user_id: string | null
  details: any
  created_at: string
  admin_email?: string
  target_email?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'audit' | 'registration' | string
  is_read: boolean
  created_at: string
}

export interface EmailTemplate {
  id: string
  slug: string
  subject: string
  body: string
  updated_at: string
}

export interface ApprovalFiltersState {
  dateRange: DateRange | undefined
  clientId: string | null
  consultantId: string | null
  status: TimeEntryStatus | 'all'
}

// Schemas factories for i18n
export const createTimeEntrySchema = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      date: z.date({
        required_error: t('validation.required'),
      }),
      projectId: z
        .string({
          required_error: t('validation.selectProject'),
        })
        .min(1, t('validation.selectProject')),
      startTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('validation.required')),
      endTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('validation.required')),
      description: z.string().min(5, t('validation.minChar', { min: 5 })),
    })
    .refine(
      (data) => {
        const [startH, startM] = data.startTime.split(':').map(Number)
        const [endH, endM] = data.endTime.split(':').map(Number)
        const startTotal = startH * 60 + startM
        const endTotal = endH * 60 + endM
        return endTotal > startTotal
      },
      {
        message: t('validation.endTimeAfterStart'),
        path: ['endTime'],
      },
    )

// Static schema for types
export const timeEntrySchema = createTimeEntrySchema((k) => k)
export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>

export const createClientSchema = (t: (key: string, options?: any) => string) =>
  z.object({
    nombre: z.string().min(2, t('validation.minChar', { min: 2 })),
    codigo: z.string().min(2, t('validation.minChar', { min: 2 })),
    pais: z.string().min(1, t('validation.selectCountry')),
    activo: z.boolean().default(true),
  })

export const clientSchema = createClientSchema((k) => k)
export type ClientFormValues = z.infer<typeof clientSchema>

export const createSystemSchema = (t: (key: string, options?: any) => string) =>
  z.object({
    nombre: z.string().min(2, t('validation.minChar', { min: 2 })),
    codigo: z.string().min(2, t('validation.minChar', { min: 2 })),
    descripcion: z.string().optional(),
    activo: z.boolean().default(true),
  })

export const systemSchema = createSystemSchema((k) => k)
export type SystemFormValues = z.infer<typeof systemSchema>

export const createProjectSchema = (
  t: (key: string, options?: any) => string,
) =>
  z.object({
    nombre: z.string().min(2, t('validation.minChar', { min: 2 })),
    codigo: z.string().min(2, t('validation.minChar', { min: 2 })),
    client_id: z.string().min(1, t('validation.selectClient')),
    gerente_id: z.string().optional(),
    system_id: z.string().optional(),
    work_front: z.enum(['Procesos', 'SAP IBP', 'SAP MDG', 'Otro']).optional(),
    status: z.enum(['activo', 'pausado', 'finalizado']),
  })

export const projectSchema = createProjectSchema((k) => k)
export type ProjectFormValues = z.infer<typeof projectSchema>
