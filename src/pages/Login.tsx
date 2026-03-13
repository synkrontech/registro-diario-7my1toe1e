import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, LogIn, UserPlus, MailWarning, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Project } from '@/lib/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { LanguageSelector } from '@/components/LanguageSelector'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isProjectsLoaded, setIsProjectsLoaded] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Handle redirect logic, correcting legacy paths to /profile-time
  const rawFrom = location.state?.from?.pathname || '/index-time'
  const from = ['/settings', '/profile'].includes(rawFrom)
    ? '/profile-time'
    : rawFrom

  // Schemas with translation
  const loginSchema = z.object({
    email: z.string().email(t('validation.emailInvalid', 'Correo inválido')),
    password: z
      .string()
      .min(
        6,
        t('validation.minChar', {
          min: 6,
          defaultValue: 'Mínimo 6 caracteres',
        }),
      ),
  })

  const registerSchema = z.object({
    email: z.string().email(t('validation.emailInvalid', 'Correo inválido')),
    password: z
      .string()
      .min(
        6,
        t('validation.minChar', {
          min: 6,
          defaultValue: 'Mínimo 6 caracteres',
        }),
      ),
    nombre: z
      .string()
      .min(
        2,
        t('validation.minChar', {
          min: 2,
          defaultValue: 'Mínimo 2 caracteres',
        }),
      ),
    apellido: z
      .string()
      .min(
        2,
        t('validation.minChar', {
          min: 2,
          defaultValue: 'Mínimo 2 caracteres',
        }),
      ),
    role: z.enum(['admin', 'director', 'gerente', 'consultor']),
    projectId: z.string().optional(),
  })

  type LoginFormValues = z.infer<typeof loginSchema>
  type RegisterFormValues = z.infer<typeof registerSchema>

  // Robust fetch projects for registration demo
  useEffect(() => {
    let isMounted = true

    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, nombre')
          .eq('status', 'activo')

        if (!isMounted) return

        if (error) {
          // Silently ignore to avoid runtime crash alerts
          console.debug(
            'Project fetch blocked or failed (RLS/Network):',
            error.message,
          )
          setIsProjectsLoaded(true)
          return
        }

        if (data && Array.isArray(data)) {
          setProjects(data as Project[])
        }
      } catch (err: any) {
        // Prevent "TypeError: Failed to fetch" from crashing the application
        if (isMounted) {
          console.debug(
            'Network exception handled safely for projects:',
            err?.message || err,
          )
        }
      } finally {
        if (isMounted) {
          setIsProjectsLoaded(true)
        }
      }
    }

    try {
      fetchProjects().catch((err) => {
        if (isMounted) {
          console.debug('Promise chain rejection caught:', err)
          setIsProjectsLoaded(true)
        }
      })
    } catch (err) {
      if (isMounted) setIsProjectsLoaded(true)
    }

    return () => {
      isMounted = false
    }
  }, [])

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      nombre: '',
      apellido: '',
      role: 'consultor',
      projectId: undefined,
    },
  })

  async function onLogin(data: LoginFormValues) {
    setIsLoading(true)
    setUnverifiedEmail(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (
          error.message.includes('Email not confirmed') ||
          (error as any).code === 'email_not_confirmed'
        ) {
          setUnverifiedEmail(data.email)
          toast({
            title: t('auth.verifyEmail', 'Verifica tu correo'),
            description: t(
              'auth.pendingMessage',
              'Revisa tu bandeja de entrada.',
            ),
            variant: 'destructive',
          })
          return
        }

        throw error
      }

      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: t('auth.errorAuth', 'Error de autenticación'),
        description:
          error.message || t('common.errorLoad', 'Ocurrió un error al cargar.'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onRegister(data: RegisterFormValues) {
    setIsLoading(true)
    try {
      const metadata = {
        nombre: data.nombre,
        apellido: data.apellido,
        role: data.role,
        projectId:
          data.role === 'consultor' &&
          data.projectId &&
          data.projectId !== 'none'
            ? data.projectId
            : null,
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/index-time`,
        },
      })

      if (error) throw error

      toast({
        title: t('auth.successRegister', 'Registro exitoso'),
        description: t(
          'auth.pendingMessage',
          'Revisa tu bandeja de entrada para verificar tu cuenta.',
        ),
        className: 'bg-green-50 text-green-800 border-green-200',
      })

      // Check if session exists (auto-login)
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session) {
        navigate(from, { replace: true })
      } else {
        // If no session, they need to verify email.
        // Switch to login tab and pre-fill email
        loginForm.setValue('email', data.email)
        // Optionally trigger the "unverified" UI state to let them know
        setUnverifiedEmail(data.email)
      }
    } catch (error: any) {
      console.error('Registration Error:', error)
      toast({
        title: t('auth.errorRegister', 'Error al registrarse'),
        description:
          error.message ||
          t('common.errorSave', 'Error al guardar. Intenta nuevamente.'),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/index-time`,
        },
      })

      if (error) throw error

      toast({
        title: t('common.success', 'Éxito'),
        description: t('auth.resendEmail', 'Correo reenviado exitosamente.'),
      })
    } catch (error: any) {
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            {t('auth.loginTitle', 'Registro Diario')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.loginSubtitle', 'Inicia sesión en tu cuenta')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unverifiedEmail ? (
            <div className="space-y-4 animate-fade-in">
              <Alert variant="destructive">
                <MailWarning className="h-4 w-4" />
                <AlertTitle>
                  {t('auth.verifyEmail', 'Verifica tu correo')}
                </AlertTitle>
                <AlertDescription>{unverifiedEmail}</AlertDescription>
              </Alert>
              <Button
                onClick={handleResendVerification}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {t('auth.resendEmail', 'Reenviar correo')}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setUnverifiedEmail(null)}
              >
                {t('auth.backToLogin', 'Volver al inicio')}
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">
                  {t('auth.login', 'Iniciar sesión')}
                </TabsTrigger>
                <TabsTrigger value="register">
                  {t('auth.register', 'Registrarse')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('auth.email', 'Correo electrónico')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="usuario@empresa.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('auth.password', 'Contraseña')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="******"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      {t('auth.login', 'Iniciar sesión')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.name', 'Nombre')}</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="apellido"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('auth.lastName', 'Apellido')}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('auth.email', 'Correo electrónico')}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="juan@ejemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('auth.password', 'Contraseña')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t('validation.minChar', {
                                min: 6,
                                defaultValue: 'Mínimo 6 caracteres',
                              })}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.role', 'Rol')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t(
                                    'auth.selectRole',
                                    'Seleccione un rol',
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="consultor">
                                {t('enums.roles.consultor', 'Consultor')}
                              </SelectItem>
                              <SelectItem value="gerente">
                                {t('enums.roles.gerente', 'Gerente')}
                              </SelectItem>
                              <SelectItem value="director">
                                {t('enums.roles.director', 'Director')}
                              </SelectItem>
                              <SelectItem value="admin">
                                {t('enums.roles.admin', 'Admin')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {registerForm.watch('role') === 'consultor' && (
                      <FormField
                        control={registerForm.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('auth.initialProject', 'Proyecto Inicial')}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={
                                !isProjectsLoaded || projects.length === 0
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={
                                      !isProjectsLoaded
                                        ? t('common.loading', 'Cargando...')
                                        : projects.length > 0
                                          ? t(
                                              'validation.selectProject',
                                              'Seleccione un proyecto',
                                            )
                                          : t(
                                              'common.unavailable',
                                              'No disponible',
                                            )
                                    }
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.length > 0 ? (
                                  projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.nombre}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>
                                    {t('common.noProjects', 'No hay proyectos')}
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {isProjectsLoaded && projects.length === 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {t(
                                  'auth.projectsUnavailable',
                                  'La lista de proyectos no está disponible en este momento.',
                                )}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {t('auth.createAccount', 'Crear cuenta')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-center flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">
            {t(
              'auth.pendingMessage',
              'Revisa tu bandeja de entrada después de registrarte.',
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
