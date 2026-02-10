import { EmailTemplateEditor } from '@/components/admin/EmailTemplateEditor'
import { Mail } from 'lucide-react'

export default function EmailSettingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Mail className="h-8 w-8 text-indigo-600" />
          Configuración de Correos
        </h2>
        <p className="text-muted-foreground">
          Gestión de plantillas y notificaciones por correo electrónico.
        </p>
      </div>

      <div className="max-w-4xl">
        <EmailTemplateEditor />
      </div>
    </div>
  )
}
