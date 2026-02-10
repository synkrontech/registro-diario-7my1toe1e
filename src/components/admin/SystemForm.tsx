import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSystemSchema, SystemFormValues, System } from '@/lib/types'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface SystemFormProps {
  initialData?: System | null
  onSubmit: (data: SystemFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function SystemForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: SystemFormProps) {
  const { t } = useTranslation()
  const systemSchema = createSystemSchema(t)

  const form = useForm<SystemFormValues>({
    resolver: zodResolver(systemSchema),
    defaultValues: {
      nombre: '',
      codigo: '',
      descripcion: '',
      activo: true,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        nombre: initialData.nombre,
        codigo: initialData.codigo,
        descripcion: initialData.descripcion || '',
        activo: initialData.activo,
      })
    } else {
      form.reset({
        nombre: '',
        codigo: '',
        descripcion: '',
        activo: true,
      })
    }
  }, [initialData, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Sistema</FormLabel>
              <FormControl>
                <Input placeholder="Ej. SAP IBP" {...field} />
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
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ej. SAP-IBP-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción breve del sistema"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {t('common.status')} {t('common.active')}
                </FormLabel>
                <FormDescription>
                  Los sistemas inactivos no aparecerán en novas selecciones.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('common.loading')
              : initialData
                ? t('common.save')
                : t('systems.newSystem')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
