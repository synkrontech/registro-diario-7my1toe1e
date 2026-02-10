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

export interface Client {
  id: string
  nombre: string
  codigo: string
  pais: string
  created_at: string
}

export interface System {
  id: string
  nombre: string
  descripcion?: string | null
  created_at: string
}

export interface Project {
  id: string
  nombre: string
  code?: string
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
  start_time: string // HH:mm:ss
  end_time: string // HH:mm:ss
  durationMinutes: number
  description?: string
  status: TimeEntryStatus
  rejection_reason?: string | null
  created_at: string

  // Virtual / Relations (for UI/Dashboard)
  project_name?: string
  client_name?: string
  date?: Date // Helper date object
  projects?: Project
  users?: User
}

// -- Zod Schemas --

export const createClientSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  pais: z.string().min(2, 'El país es requerido'),
})

export const createSystemSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
})

export const createProjectSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  client_id: z.string().min(1, 'Seleccione un cliente válido'),
  system_id: z.string().optional(),
  gerente_id: z.string().optional(),
  status: z.enum(['activo', 'pausado', 'finalizado']).default('activo'),
  work_front: z.string().optional(),
})

export const createTimeEntrySchema = z
  .object({
    project_id: z.string().min(1, 'Seleccione un proyecto'),
    date: z.date({
      required_error: 'La fecha es requerida',
    }),
    start_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
    end_time: z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato inválido (HH:MM)'),
    description: z.string().min(1, 'La descripción es requerida'),
  })
  .refine(
    (data) => {
      if (!data.start_time || !data.end_time) return true
      const [startH, startM] = data.start_time.split(':').map(Number)
      const [endH, endM] = data.end_time.split(':').map(Number)
      const start = startH * 60 + startM
      const end = endH * 60 + endM
      return end > start
    },
    {
      message: 'La hora de fin debe ser posterior a la de inicio',
      path: ['end_time'],
    },
  )

// -- Form Types --
export type CreateClientForm = z.infer<typeof createClientSchema>
export type CreateSystemForm = z.infer<typeof createSystemSchema>
export type CreateProjectForm = z.infer<typeof createProjectSchema>
export type CreateTimeEntryForm = z.infer<typeof createTimeEntrySchema>
