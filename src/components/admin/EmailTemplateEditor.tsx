import { useState, useEffect } from 'react'
import { EmailTemplate } from '@/lib/types'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Save } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export function EmailTemplateEditor() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [activeSlug, setActiveSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await adminService.getEmailTemplates()
      setTemplates(data)
      if (data.length > 0 && !activeSlug) {
        setActiveSlug(data[0].slug)
        setSubject(data[0].subject)
        setBody(data[0].body)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (slug: string) => {
    const tmpl = templates.find((t) => t.slug === slug)
    if (tmpl) {
      setActiveSlug(slug)
      setSubject(tmpl.subject)
      setBody(tmpl.body)
    }
  }

  const handleSave = async () => {
    if (!user || !activeSlug) return
    setSaving(true)
    const tmpl = templates.find((t) => t.slug === activeSlug)
    if (!tmpl) return

    try {
      await adminService.updateEmailTemplate(user.id, tmpl.id, subject, body)

      // Update local state
      setTemplates((prev) =>
        prev.map((t) => (t.slug === activeSlug ? { ...t, subject, body } : t)),
      )

      toast({
        title: 'Plantilla guardada',
        description: 'Los cambios se aplicarán en los próximos correos.',
      })
    } catch (error) {
      toast({
        title: 'Error al guardar',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Cargando plantillas...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Plantillas de Correo</CardTitle>
        <CardDescription>
          Personaliza los correos automáticos enviados por el sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeSlug || undefined}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="mb-4 flex-wrap h-auto">
            {templates.map((t) => (
              <TabsTrigger key={t.slug} value={t.slug} className="capitalize">
                {t.slug.replace(/_/g, ' ')}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">
                Cuerpo del mensaje
                <span className="text-xs text-muted-foreground ml-2 font-normal">
                  (Variables disponibles: {'{{nombre}}'}, {'{{email}}'},{' '}
                  {'{{url}}'})
                </span>
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Guardar Cambios
        </Button>
      </CardFooter>
    </Card>
  )
}
