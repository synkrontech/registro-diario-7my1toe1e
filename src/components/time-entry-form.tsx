import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Save, X } from 'lucide-react'
import { format, isSameMonth } from 'date-fns'
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
  currentDate: Date
  onDateChange: (date: Date) => void
  entryToEdit?: TimeEntry | null
  onCancelEdit: () => void
}

export function TimeEntryForm({
  currentDate,
  onDateChange,
  entryToEdit,
  onCancelEdit,
}: TimeEntryFormProps) {
  const { addEntry, updateEntry } = useTimeStore()
  const { toast } = useToast()

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      date: currentDate,
      startTime: '',
      endTime: '',
      description: '',
      project: '',
    },
  })

  // Update form date when currentDate changes (month navigation) and we are NOT editing
  useEffect(() => {
    if (!entryToEdit) {
      // If the current form date is in a different month than the new currentDate
      // update it to the new currentDate (which is usually 1st of month or today)
      // to keep the form in sync with the view context.
      const currentFormDate = form.getValues('date')
      if (!isSameMonth(currentFormDate, currentDate)) {
        form.setValue('date', currentDate)
      }
    }
  }, [currentDate, entryToEdit, form])

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
  // We only want to notify parent if the USER changes the date in the form
  // But strictly speaking, the parent passes currentDate down.
  // If the user picks a date in the form, we might want to update the parent's view to that month.
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
          description: 'Tu actividad ha sido registrada exitosamente.',
          className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        })
      }

      // Reset form but keep the current date context
      form.reset({
        date: data.date, // Keep the same date for next entry
        project: data.project, // Keep project for convenience
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
      date: currentDate,
      startTime: '',
      endTime: '',
      description: '',
      project: '',
    })
  }

  return (
    <Card className="border-none shadow-md overflow-hidden">
      <CardHeader
        className={cn('border-b', entryToEdit ? 'bg-blue-50/50' : 'bg-white')}
      >
        <CardTitle className="text-xl font-semibold text-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {entryToEdit ? (
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-indigo-500" />
            )}
            <span>{entryToEdit ? 'Modificar Registro' : 'Nuevo Registro'}</span>
          </div>
          {entryToEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="mr-1 h-4 w-4" /> Cancelar Edición
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
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
                              format(field.value, 'PPP', { locale: es })
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
                  <FormLabel>Descripción de Actividades</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalla las tareas realizadas..."
                      className="resize-none min-h-[100px]"
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
                'w-full md:w-auto transition-all duration-200',
                entryToEdit
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
              )}
              size="lg"
            >
              {entryToEdit ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {entryToEdit ? 'Guardar Cambios' : 'Registrar Actividad'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
