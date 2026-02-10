import { z } from 'zod'

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
  // For UI display
  project_name: string
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

export const timeEntrySchema = z
  .object({
    date: z.date({
      required_error: 'La fecha es requerida',
    }),
    projectId: z
      .string({
        required_error: 'Selecciona un proyecto',
      })
      .min(1, 'Selecciona un proyecto'),
    startTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido'),
    endTime: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido'),
    description: z
      .string()
      .min(5, 'La descripción debe tener al menos 5 caracteres'),
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
      message: 'La hora de fin debe ser posterior a la de inicio',
      path: ['endTime'],
    },
  )

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>

export const clientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  pais: z.string().min(1, 'Selecciona un país'),
  activo: z.boolean().default(true),
})

export type ClientFormValues = z.infer<typeof clientSchema>

export const systemSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true),
})

export type SystemFormValues = z.infer<typeof systemSchema>

export const projectSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  client_id: z.string().min(1, 'Selecciona un cliente'),
  gerente_id: z.string().optional(),
  system_id: z.string().optional(),
  work_front: z.enum(['Procesos', 'SAP IBP', 'SAP MDG', 'Otro']).optional(),
  status: z.enum(['activo', 'pausado', 'finalizado']),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
