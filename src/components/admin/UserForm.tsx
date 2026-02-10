import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserProfile, Role } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type UserFormProps = {
  initialData?: UserProfile | null
  roles: Role[]
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function UserForm({
  initialData,
  roles,
  onSubmit,
  onCancel,
  isSubmitting,
}: UserFormProps) {
  const { t } = useTranslation()
  const isEditing = !!initialData

  const baseSchema = z.object({
    nombre: z.string().min(2, t('validation.minChar', { min: 2 })),
    apellido: z.string().min(2, t('validation.minChar', { min: 2 })),
    role_id: z.string().min(1, t('auth.selectRole')),
    activo: z.boolean(),
  })

  const createSchema = baseSchema.extend({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(6, t('validation.minChar', { min: 6 })),
  })

  const updateSchema = baseSchema.extend({
    email: z.string().email().optional(), // Read only
  })

  const form = useForm({
    resolver: zodResolver(isEditing ? updateSchema : createSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      apellido: initialData?.apellido || '',
      email: initialData?.email || '',
      role_id: initialData?.role_id || '',
      activo: initialData?.activo ?? true,
      password: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.name')}</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="apellido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.lastName')}</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.email')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="usuario@empresa.com"
                  {...field}
                  disabled={isEditing}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="******"
                    {...field}
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormDescription>
                  {t('validation.minChar', { min: 6 })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="role_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.role')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('auth.selectRole')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
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
            name="activo"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>{t('common.status')}</FormLabel>
                <div className="flex items-center gap-2 h-10">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm text-muted-foreground">
                    {field.value ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? t('common.save') : t('auth.createAccount')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
