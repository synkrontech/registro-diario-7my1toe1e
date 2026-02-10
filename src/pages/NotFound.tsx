/* 404 Page - Displays when a user attempts to access a non-existent route - translate to the language of the user */
import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

const NotFound = () => {
  const { t } = useTranslation()
  const location = useLocation()

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname,
    )
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-900">404</h1>
        <p className="text-xl text-gray-600">
          Oops! {t('common.error')} - Page not found
        </p>
        <Button asChild>
          <Link to="/">{t('sidebar.dashboard')}</Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
