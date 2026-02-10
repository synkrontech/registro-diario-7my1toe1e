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
import { useTranslation } from 'react-i18next'

export default function PendingApproval() {
  const { t } = useTranslation()
  const { signOut, profile } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-orange-200">
        <CardHeader className="text-center">
          <div className="mx-auto bg-orange-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-900">
            {t('auth.pendingApproval')}
          </CardTitle>
          <CardDescription>
            {t('common.welcome')}, {profile?.nombre || 'Usuario'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-slate-600">{t('auth.pendingMessage')}</p>
          <p className="text-sm text-muted-foreground">
            Contact: admin@goskip.app
          </p>

          <Button
            variant="outline"
            onClick={signOut}
            className="w-full border-slate-200 hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('common.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
