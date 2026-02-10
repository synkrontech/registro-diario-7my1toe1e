import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Plus, Save, X, Loader2 } from 'lucide-react'
import { format, isSameMonth } from 'date-fns'

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
  createTimeEntrySchema,
  TimeEntry,
} from '@/lib/types'
import useTimeStore from '@/stores/useTimeStore'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'

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
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const { addEntry, updateEntry, projects } = useTimeStore()
  const { toast } = useToast()

  const formSchema = createTimeEntrySchema(t)

  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: currentDate,
      startTime: '',
      endTime: '',
      description: '',
      projectId: '',
    },
  })

  useEffect(() => {
    if (!entryToEdit) {
      const currentFormDate = form.getValues('date')
      if (!isSameMonth(currentFormDate, currentDate)) {
        form.setValue('date', currentDate)
      }
    }
  }, [currentDate, entryToEdit, form])

  useEffect(() => {
    if (entryToEdit) {
      form.reset({
        date: entryToEdit.date,
        projectId: entryToEdit.project_id, // Use ID here
        startTime: entryToEdit.startTime,
        endTime: entryToEdit.endTime,
        description: entryToEdit.description,
      })
    }
  }, [entryToEdit, form])

  const watchedDate = form.watch('date')
  useEffect(() => {
    if (watchedDate) {
      onDateChange(watchedDate)
    }
  }, [watchedDate, onDateChange])

  async function onSubmit(data: TimeEntryFormValues) {
    try {
      if (entryToEdit) {
        await updateEntry(entryToEdit.id, data)
        toast({
          title: t('timeEntry.editEntry'),
          description: t('timeEntry.saveChanges'),
          className: 'bg-blue-50 border-blue-200 text-blue-800',
        })
        onCancelEdit()
      } else {
        await addEntry(data)
        toast({
          title: t('timeEntry.newEntry'),
          description: t('timeEntry.register'),
          className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        })
      }

      form.reset({
        date: data.date,
        projectId: data.projectId,
        startTime: '',
        endTime: '',
        description: '',
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
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
      projectId: '',
    })
  }

  const isSubmitting = form.formState.isSubmitting

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
            <span>
              {entryToEdit ? t('timeEntry.editEntry') : t('timeEntry.newEntry')}
            </span>
          </div>
          {entryToEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="mr-1 h-4 w-4" /> {t('common.cancel')}
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
                    <FormLabel>{t('timeEntry.date')}</FormLabel>
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
                              format(field.value, 'P', { locale: dateLocale })
                            ) : (
                              <span>{t('timeEntry.date')}</span>
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
                          locale={dateLocale}
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
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('timeEntry.project')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('validation.selectProject')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No hay proyectos disponibles
                          </div>
                        ) : (
                          projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.nombre}
                            </SelectItem>
                          ))
                        )}
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
                    <FormLabel>{t('timeEntry.startTime')}</FormLabel>
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
                    <FormLabel>{t('timeEntry.endTime')}</FormLabel>
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
                  <FormLabel>{t('timeEntry.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('timeEntry.descriptionPlaceholder')}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : entryToEdit ? (
                <Save className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {entryToEdit
                ? t('timeEntry.saveChanges')
                : t('timeEntry.register')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
