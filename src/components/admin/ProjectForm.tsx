import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createProjectSchema,
  ProjectFormValues,
  Project,
  Client,
  System,
  UserProfile,
} from '@/lib/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface ProjectFormProps {
  initialData?: Project | null
  clients: Client[]
  managers: Partial<UserProfile>[]
  systems: System[]
  onSubmit: (data: ProjectFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function ProjectForm({
  initialData,
  clients,
  managers,
  systems,
  onSubmit,
  onCancel,
  isSubmitting,
}: ProjectFormProps) {
  const { t } = useTranslation()
  const projectSchema = createProjectSchema(t)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      client_id: '',
      gerente_id: undefined,
      system_id: undefined,
      work_front: undefined,
      status: 'activo',
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre,
        codigo: initialData.codigo,
        client_id: initialData.client_id,
        gerente_id: initialData.gerente_id || undefined,
        system_id: initialData.system_id || undefined,
        work_front: (initialData.work_front as any) || undefined,
        status: initialData.status,
      })
    } else {
      form.reset({
        nombre: '',
        codigo: '',
        client_id: '',
        gerente_id: undefined,
        system_id: undefined,
        work_front: undefined,
        status: 'activo',
      })
    }
  }, [initialData, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('timeEntry.project')}</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Implementación SAP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('clients.code')}</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. PRJ-2024-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('timeEntry.client')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('validation.selectClient')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gerente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('projects.manager')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('validation.required')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id!}>
                        {manager.nombre} {manager.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="system_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('timeEntry.system')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('validation.required')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {systems.map((system) => (
                      <SelectItem key={system.id} value={system.id}>
                        {system.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="work_front"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('projects.workFront')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('validation.required')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Procesos">
                      {t('enums.workFront.Procesos')}
                    </SelectItem>
                    <SelectItem value="SAP IBP">
                      {t('enums.workFront.SAP IBP')}
                    </SelectItem>
                    <SelectItem value="SAP MDG">
                      {t('enums.workFront.SAP MDG')}
                    </SelectItem>
                    <SelectItem value="Otro">
                      {t('enums.workFront.Otro')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.status')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.status')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="activo">
                    {t('enums.projectStatus.activo')}
                  </SelectItem>
                  <SelectItem value="pausado">
                    {t('enums.projectStatus.pausado')}
                  </SelectItem>
                  <SelectItem value="finalizado">
                    {t('enums.projectStatus.finalizado')}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('common.loading')
              : initialData
                ? t('common.save')
                : t('projects.newProject')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
