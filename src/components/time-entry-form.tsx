import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TimeEntryFormValues,
  timeEntrySchema,
  PROJECTS,
  TimeEntry,
} from '@/lib/types'
import useTimeStore from '@/stores/useTimeStore'
import { useToast } from '@/hooks/use-toast'

interface TimeEntryFormProps {
  onDateChange: (date: Date) => void
  entryToEdit?: TimeEntry | null
  onCancelEdit: () => void
}

export function TimeEntryForm({
  onDateChange,
  entryToEdit,
  onCancelEdit,
}: TimeEntryFormProps) {
  const { addEntry, updateEntry } = useTimeStore()
  const { toast } = useToast()

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: new Date(),
      startTime: '',
      endTime: '',
      description: '',
      project: '',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (entryToEdit) {
      form.reset({
        date: entryToEdit.date,
        project: entryToEdit.project,
        startTime: entryToEdit.startTime,
        endTime: entryToEdit.endTime,
        description: entryToEdit.description,
      })
    }
  }, [entryToEdit, form])

  // Sync selected date with parent safely
  const watchedDate = form.watch('date')
  useEffect(() => {
    if (watchedDate) {
      onDateChange(watchedDate)
    }
  }, [watchedDate, onDateChange])

  function onSubmit(data: TimeEntryFormValues) {
    try {
      if (entryToEdit) {
        updateEntry(entryToEdit.id, data)
        toast({
          title: 'Registro actualizado',
          description: 'La actividad ha sido modificada correctamente.',
          className: 'bg-blue-50 border-blue-200 text-blue-800',
        })
        onCancelEdit()
      } else {
        addEntry(data)
        toast({
          title: 'Registro guardado',
          description: 'Tu actividad ha sido registrada.',
          className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        })
      }

      form.reset({
        date: data.date,
        project: data.project,
        startTime: '',
        endTime: '',
        description: '',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Revisa los campos e intenta nuevamente.',
        variant: 'destructive',
      })
    }
  }

  function handleCancel() {
    onCancelEdit()
    form.reset({
      date: new Date(),
      startTime: '',
      endTime: '',
      description: '',
      project: '',
    })
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-800 flex justify-between items-center">
          <span>
            {entryToEdit ? 'Editar Actividad' : 'Registro de Actividad'}
          </span>
          {entryToEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-slate-500"
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'P', { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proyecto</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un proyecto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECTS.map((project) => (
                          <SelectItem key={project} value={project}>
                            {project}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actividades</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe aquí lo que hiciste..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={cn(
                'w-full md:w-auto transition-colors duration-150',
                entryToEdit
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-indigo-600 hover:bg-indigo-700',
              )}
            >
              {entryToEdit ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {entryToEdit ? 'Actualizar Registro' : 'Guardar Registro'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
