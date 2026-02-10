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

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'Nombre requerido'),
  apellido: z.string().min(2, 'Apellido requerido'),
  role: z.enum(['admin', 'director', 'gerente', 'consultor']),
  projectId: z.string().optional(),
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  // Fetch projects for registration demo
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select('*')

      if (error) {
        console.error('Error fetching projects:', error)
        return
      }

      if (data) setProjects(data as Project[])
    }
    fetchProjects()
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
            title: 'Email no verificado',
            description:
              'Por favor verifica tu correo electrónico para continuar.',
            variant: 'destructive',
          })
          return
        }

        throw error
      }

      navigate(from, { replace: true })
    } catch (error: any) {
      toast({
        title: 'Error de autenticación',
        description: error.message || 'Credenciales incorrectas',
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
          data.role === 'consultor' && data.projectId ? data.projectId : null,
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      toast({
        title: 'Registro exitoso',
        description:
          'Tu cuenta ha sido creada. Hemos enviado un correo de verificación.',
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
        title: 'Error de registro',
        description: error.message || 'Ocurrió un error al crear la cuenta',
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
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error

      toast({
        title: 'Correo enviado',
        description: `Se ha enviado un nuevo enlace de verificación a ${unverifiedEmail}`,
      })
    } catch (error: any) {
      toast({
        title: 'Error al reenviar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            Registro Diario
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de gestión de tiempos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unverifiedEmail ? (
            <div className="space-y-4 animate-fade-in">
              <Alert variant="destructive">
                <MailWarning className="h-4 w-4" />
                <AlertTitle>Verificación Pendiente</AlertTitle>
                <AlertDescription>
                  El correo {unverifiedEmail} no ha sido verificado aún.
                </AlertDescription>
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
                Reenviar Correo de Verificación
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setUnverifiedEmail(null)}
              >
                Volver al inicio de sesión
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register">Registrarse</TabsTrigger>
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
                          <FormLabel>Correo Electrónico</FormLabel>
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
                          <FormLabel>Contraseña</FormLabel>
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
                      Ingresar
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
                            <FormLabel>Nombre</FormLabel>
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
                            <FormLabel>Apellido</FormLabel>
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
                          <FormLabel>Correo</FormLabel>
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
                          <FormLabel>Contraseña</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Min. 6 caracteres"
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
                          <FormLabel>Rol (Solicitado)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="consultor">
                                Consultor
                              </SelectItem>
                              <SelectItem value="gerente">Gerente</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
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
                            <FormLabel>Proyecto Inicial</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Asignar a proyecto (Opcional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                      Crear Cuenta
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-center flex-col gap-2">
          <p className="text-xs text-muted-foreground text-center">
            Las nuevas cuentas requieren aprobación de un administrador.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
