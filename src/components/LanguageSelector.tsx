import { useTranslation } from 'react-i18next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { es, ptBR, enUS } from 'date-fns/locale'
import { useAuth } from '@/components/AuthProvider'
import { userService } from '@/services/userService'

// Define supported languages
export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸', locale: es },
  { code: 'pt', name: 'Português', flag: '🇧🇷', locale: ptBR },
  { code: 'en', name: 'English', flag: '🇺🇸', locale: enUS },
]

export function LanguageSelector({
  variant = 'default',
}: {
  variant?: 'default' | 'minimal'
}) {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLang =
    languages.find((l) => l.code === i18n.language) || languages[0]

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)

    if (user) {
      try {
        await userService.updateUserPreferences(user.id, { idioma: code })
      } catch (error) {
        console.error('Failed to update language preference', error)
      }
    }
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'minimal' ? 'ghost' : 'outline'}
          size={variant === 'minimal' ? 'icon' : 'default'}
          className={cn(
            'gap-2',
            variant === 'minimal'
              ? 'h-9 w-9 px-0'
              : 'min-w-[120px] justify-between',
          )}
        >
          <span className="text-lg leading-none">{currentLang.flag}</span>
          {variant !== 'minimal' && (
            <span className="text-sm font-medium hidden sm:inline-block">
              {currentLang.name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="gap-2 cursor-pointer"
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <Check className="h-4 w-4 text-indigo-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility to get current date-fns locale based on i18n
export const useDateLocale = () => {
  const { i18n } = useTranslation()
  const lang = languages.find((l) => l.code === i18n.language)
  return lang?.locale || es
}
