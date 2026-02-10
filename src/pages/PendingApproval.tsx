import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LogOut, ShieldAlert } from 'lucide-react'

export default function PendingApproval() {
  const { signOut, profile } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            Cuenta Pendiente de Aprobación
          </CardTitle>
          <CardDescription>
            Hola, {profile?.nombre || 'Usuario'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-slate-600">
            Tu cuenta ha sido creada exitosamente y tu correo verificado, pero
            aún requieres la aprobación de un administrador para acceder al
            sistema.
          </p>
          <p className="text-sm text-muted-foreground">
            Por favor, contacta a tu supervisor o al administrador del sistema
            para activar tu cuenta.
          </p>

          <Button
            variant="outline"
            onClick={signOut}
            className="w-full border-slate-200 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
