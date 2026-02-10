import { z } from 'zod'

export interface TimeEntry {
  id: string
  date: Date
  project: string
  startTime: string
  endTime: string
  description: string
  durationMinutes: number
}

export const PROJECTS = [
  'Proyecto Alfa',
  'Proyecto Beta',
  'Mantenimiento',
  'Reunión Interna',
  'Desarrollo Frontend',
] as const

export const timeEntrySchema = z
  .object({
    date: z.date({
      required_error: 'La fecha es requerida',
    }),
    project: z
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
