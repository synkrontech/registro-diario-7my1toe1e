import { z } from 'zod'

// -- Enums & Basic Types --
export type Role = 'admin' | 'director' | 'gerente' | 'consultor'
export type ProjectStatus = 'activo' | 'pausado' | 'finalizado'
export type TimeEntryStatus = 'pendiente' | 'aprobado' | 'rechazado'

// -- Database Entities --

export interface User {
  id: string
  email: string
  nombre: string
  apellido: string
  role: Role
  avatar_url?: string | null
  manager_id?: string | null
  created_at: string
}

export interface UserPermission {
  code: string
  resourceId?: string | null
  resourceType?: string | null
}

export interface UserProfile extends User {
  activo: boolean
  role_id: string
  permissions: UserPermission[]
}

export interface UserPreferences {
  id: string
  user_id: string
  idioma: 'es' | 'pt' | 'en'
  timezone: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  nombre: string
  codigo: string
  pais: string
  activo: boolean
  created_at: string
}

export interface System {
  id: string
  nombre: string
  descripcion?: string | null
  activo: boolean
  created_at: string
}

export interface Project {
  id: string
  nombre: string
  codigo?: string
  client_id: string
  system_id?: string | null
  gerente_id?: string | null
  status: ProjectStatus
  work_front?: string | null
  created_at: string

  // Relations
  clients?: Client
  systems?: System
  users?: User // Manager
}

export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  fecha: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  durationMinutes: number
  description?: string
  status: TimeEntryStatus
  rejection_reason?: string | null
  created_at: string

  // Virtual / Relations (for UI/Dashboard)
  project_name?: string
  client_name?: string
  system_name?: string
  date: Date // Helper date object
  projects?: Project
  users?: User
}

export interface ApprovalTimeEntry extends TimeEntry {
  user_name: string
  user_avatar?: string
  user_email: string
  projectName: string
  clientName: string
  systemName: string
}

export interface ApprovalFiltersState {
  dateRange: { from: Date; to: Date } | undefined
  clientId: string | null
  consultantId: string | null
  status: string
}

export interface AuditLog {
  id: string
  action_type: string
  admin_id?: string | null
  target_user_id?: string | null
  details: any
  created_at: string
  admin_email?: string
  target_email?: string
}

export interface Permission {
  id: string
  code: string
  description?: string
}

// -- Zod Schemas --

export const createClientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  pais: z.string().min(2, 'El país es requerido'),
  activo: z.boolean().default(true),
})

export const createSystemSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
})

export const createProjectSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  client_id: z.string().min(1, 'Seleccione un cliente válido'),
  system_id: z.string().optional(),
  gerente_id: z.string().optional(),
  status: z.enum(['activo', 'pausado', 'finalizado']).default('activo'),
  work_front: z.string().optional(),
})

// Corrected to be a function that accepts 't' for translations
export const createTimeEntrySchema = (
  t: (key: string, options?: any) => string,
) =>
  z
    .object({
      projectId: z
        .string()
        .min(1, t('validation.selectProject') || 'Seleccione un proyecto'),
      date: z.date({
        required_error: t('validation.dateRequired') || 'La fecha es requerida',
      }),
      startTime: z
        .string()
        .regex(
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          t('validation.invalidFormat') || 'Formato inválido (HH:MM)',
        ),
      endTime: z
        .string()
        .regex(
          /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          t('validation.invalidFormat') || 'Formato inválido (HH:MM)',
        ),
      description: z
        .string()
        .min(
          1,
          t('validation.descriptionRequired') || 'La descripción es requerida',
        ),
    })
    .refine(
      (data) => {
        if (!data.startTime || !data.endTime) return true
        const [startH, startM] = data.startTime.split(':').map(Number)
        const [endH, endM] = data.endTime.split(':').map(Number)
        const start = startH * 60 + startM
        const end = endH * 60 + endM
        return end > start
      },
      {
        message:
          t('validation.endTimeAfterStart') ||
          'La hora de fin debe ser posterior a la de inicio',
        path: ['endTime'],
      },
    )

// -- Form Types --
export type CreateClientForm = z.infer<typeof createClientSchema>
export type ClientFormValues = CreateClientForm
export type CreateSystemForm = z.infer<typeof createSystemSchema>
export type SystemFormValues = CreateSystemForm
export type CreateProjectForm = z.infer<typeof createProjectSchema>
export type ProjectFormValues = CreateProjectForm

// Helper for type inference since createTimeEntrySchema is now a function
const timeEntrySchemaForType = createTimeEntrySchema((k) => k)
export type CreateTimeEntryForm = z.infer<typeof timeEntrySchemaForType>
export type TimeEntryFormValues = CreateTimeEntryForm
