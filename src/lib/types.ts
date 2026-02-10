import { z } from 'zod'

// Simplified UserRole for backward compatibility in code, but now essentially string
export type UserRole = string
export type ProjectStatus = 'activo' | 'pausado' | 'finalizado'
export type TimeEntryStatus = 'pendiente' | 'aprobado' | 'rechazado'

export interface Permission {
  id: string
  code: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions?: Permission[]
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
  permissions?: string[] // List of permission codes
}

export interface Client {
  id: string
  nombre: string
  codigo: string
  pais: string
  activo: boolean
}

export interface System {
  id: string
  nombre: string
  codigo: string
  descripcion: string
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
  // Joined fields for UI convenience
  client_name?: string
  system_name?: string
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
