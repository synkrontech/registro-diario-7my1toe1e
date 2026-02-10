import { useTranslation } from 'react-i18next'
import { PieChart as PieChartIcon } from 'lucide-react'
import { UserReport } from '@/components/UserReport'
import { ProjectReport } from '@/components/ProjectReport'
import { ManagerReport } from '@/components/ManagerReport'
import { ExecutiveReport } from '@/components/ExecutiveReport'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/components/AuthProvider'

export default function Reports() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  // Determine if user can see Manager Report tab
  const canViewManagerReport = ['admin', 'director', 'gerente'].includes(
    profile?.role || '',
  )
  const canViewExecutiveReport = ['admin', 'director'].includes(
    profile?.role || '',
  )

  const getGridCols = () => {
    let cols = 2
    if (canViewManagerReport) cols += 1
    if (canViewExecutiveReport) cols += 1
    return cols
  }

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <PieChartIcon className="h-8 w-8 text-indigo-600" />
          {t('reports.title')}
        </h2>
        <p className="text-muted-foreground">{t('reports.subtitle')}</p>
      </div>

      <Tabs defaultValue="user-report" className="w-full">
        <TabsList
          className="grid w-full max-w-4xl"
          style={{ gridTemplateColumns: `repeat(${getGridCols()}, 1fr)` }}
        >
          <TabsTrigger value="user-report">
            {t('reports.reportFor')} {t('common.user')}
          </TabsTrigger>
          <TabsTrigger value="project-report">
            {t('reports.projectReportTitle')}
          </TabsTrigger>
          {canViewManagerReport && (
            <TabsTrigger value="manager-report">
              {t('reports.managerReportTitle')}
            </TabsTrigger>
          )}
          {canViewExecutiveReport && (
            <TabsTrigger value="executive-report">
              {t('reports.executiveReportTitle')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="user-report" className="mt-6">
          <UserReport />
        </TabsContent>
        <TabsContent value="project-report" className="mt-6">
          <ProjectReport />
        </TabsContent>
        {canViewManagerReport && (
          <TabsContent value="manager-report" className="mt-6">
            <ManagerReport />
          </TabsContent>
        )}
        {canViewExecutiveReport && (
          <TabsContent value="executive-report" className="mt-6">
            <ExecutiveReport />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
