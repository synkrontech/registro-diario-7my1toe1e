import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useToast } from '@/hooks/use-toast'
import { userService } from '@/services/userService'
import { languages } from '@/components/LanguageSelector'
import { Loader2, Save, User as UserIcon, Settings } from 'lucide-react'

const timezones = [
  { value: 'America/Sao_Paulo', label: 'América/São_Paulo (GMT-3)' },
  { value: 'America/La_Paz', label: 'América/La_Paz (GMT-4)' },
  { value: 'America/Bogota', label: 'América/Bogotá (GMT-5)' },
  { value: 'America/Mexico_City', label: 'América/Mexico_City (GMT-6)' },
  { value: 'UTC', label: 'UTC' },
]

export default function Profile() {
  const { t, i18n } = useTranslation()
  const { user, profile, preferences } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [selectedTimezone, setSelectedTimezone] = useState(
    preferences?.timezone || 'UTC',
  )

  useEffect(() => {
    setSelectedLanguage(i18n.language)
  }, [i18n.language])

  useEffect(() => {
    if (preferences?.timezone) {
      setSelectedTimezone(preferences.timezone)
    }
  }, [preferences])

  const handleLanguageChange = (val: string) => {
    if (val) setSelectedLanguage(val)
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Update DB
      await userService.updateUserPreferences(user.id, {
        idioma: selectedLanguage,
        timezone: selectedTimezone,
      })

      // Update Local State
      i18n.changeLanguage(selectedLanguage)
      localStorage.setItem('language', selectedLanguage)

      toast({
        title: t('common.success'),
        description: t('common.saved'),
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!profile) return null

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20 space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <UserIcon className="h-8 w-8 text-indigo-600" />
          {t('profile.title')}
        </h2>
        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Read-only Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.personalInfo')}</CardTitle>
            <CardDescription>{t('users.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('auth.name')}</Label>
              <Input value={profile.nombre} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.lastName')}</Label>
              <Input
                value={profile.apellido}
                disabled
                className="bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.email')}</Label>
              <Input value={profile.email} disabled className="bg-slate-50" />
            </div>
            <div className="space-y-2">
              <Label>{t('auth.role')}</Label>
              <Input
                value={t(`enums.roles.${profile.role}`)}
                disabled
                className="bg-slate-50 capitalize"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Editable Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('profile.preferences')}
            </CardTitle>
            <CardDescription>{t('settings.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>{t('profile.language')}</Label>
              <ToggleGroup
                type="single"
                value={selectedLanguage}
                onValueChange={handleLanguageChange}
                className="justify-start"
              >
                {languages.map((lang) => (
                  <ToggleGroupItem
                    key={lang.code}
                    value={lang.code}
                    aria-label={lang.name}
                    className="border px-4 py-2 h-auto flex gap-2 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-700 data-[state=on]:border-indigo-200"
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="space-y-3">
              <Label>{t('profile.timezone')}</Label>
              <Select
                value={selectedTimezone}
                onValueChange={setSelectedTimezone}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('profile.selectTimezone')} />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {t('profile.savePreferences')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
