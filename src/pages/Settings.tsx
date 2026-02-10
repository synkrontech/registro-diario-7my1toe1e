import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { LanguageSelector } from '@/components/LanguageSelector'
import { Globe } from 'lucide-react'

export default function Settings() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Globe className="h-8 w-8 text-indigo-600" />
          {t('settings.title')}
        </h2>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.language')}</CardTitle>
            <CardDescription>{t('settings.selectLanguage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
              <span className="font-medium text-slate-700">
                {t('settings.language')}
              </span>
              <LanguageSelector />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
