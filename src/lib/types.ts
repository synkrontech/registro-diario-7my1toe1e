export type UserRole = 'admin' | 'director' | 'gerente' | 'consultor'

export interface Profile {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  role: UserRole
  activo: boolean
  avatar_url?: string | null
}

export type TimeEntryStatus = 'pendiente' | 'aprobado' | 'rechazado'

export interface TimeEntry {
  id: string
  user_id: string
  project_id: string
  fecha: string
  startTime: string
  endTime: string
  durationMinutes: number
  description: string
  status: TimeEntryStatus
  rejectionReason?: string | null
  created_at?: string
  updated_at?: string

  // Virtual fields / Joins
  project_name?: string
  client_name?: string
  date: Date
}

export interface Project {
  id: string
  nombre: string
  codigo?: string
  client_id?: string
  gerente_id?: string
  status: 'activo' | 'pausado' | 'finalizado'
  work_front?: string
  created_at?: string
}

export interface Client {
  id: string
  nombre: string
  codigo: string
  pais: string
  created_at?: string
}

export interface System {
  id: string
  nombre: string
  description?: string
  created_at?: string
}

export interface ExecutiveReportItem {
  project: string
  client: string
  manager: string
  status: string
  totalHours: number
  totalConsultants: number
}
