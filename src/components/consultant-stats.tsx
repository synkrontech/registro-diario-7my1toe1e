import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PieChart, Hourglass, CheckCircle2, XCircle } from 'lucide-react'
import useTimeStore from '@/stores/useTimeStore'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ConsultantStatsProps {
  date: Date
}

export function ConsultantStats({ date }: ConsultantStatsProps) {
  const { t } = useTranslation()
  const { getEntriesByMonth } = useTimeStore()

  // Always get all entries for the month regardless of filter for the stats
  const entries = getEntriesByMonth(date)

  const stats = useMemo(() => {
    const initialStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    }

    const calculated = entries.reduce((acc, entry) => {
      acc.total += entry.durationMinutes
      if (entry.status === 'pendiente') acc.pending += entry.durationMinutes
      if (entry.status === 'aprobado') acc.approved += entry.durationMinutes
      if (entry.status === 'rechazado') acc.rejected += entry.durationMinutes
      return acc
    }, initialStats)

    return {
      pending: {
        minutes: calculated.pending,
        hours: (calculated.pending / 60).toFixed(1),
        percentage: calculated.total
          ? (calculated.pending / calculated.total) * 100
          : 0,
      },
      approved: {
        minutes: calculated.approved,
        hours: (calculated.approved / 60).toFixed(1),
        percentage: calculated.total
          ? (calculated.approved / calculated.total) * 100
          : 0,
      },
      rejected: {
        minutes: calculated.rejected,
        hours: (calculated.rejected / 60).toFixed(1),
        percentage: calculated.total
          ? (calculated.rejected / calculated.total) * 100
          : 0,
      },
      total: {
        minutes: calculated.total,
        hours: (calculated.total / 60).toFixed(1),
      },
    }
  }, [entries])

  return (
    <Card className="border-none shadow-md bg-white overflow-hidden">
      <CardHeader className="pb-4 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-indigo-500" />
            {t('timeEntry.monthlyStats')}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Approved Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">
                {t('timeEntry.approvedHours')}
              </span>
            </div>
            <span className="text-sm font-bold text-green-700">
              {stats.approved.hours} h
            </span>
          </div>
          <Progress
            value={stats.approved.percentage}
            className="h-2 bg-slate-100 [&>div]:bg-green-500"
          />
        </div>

        {/* Pending Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hourglass className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-slate-700">
                {t('timeEntry.pendingHours')}
              </span>
            </div>
            <span className="text-sm font-bold text-amber-700">
              {stats.pending.hours} h
            </span>
          </div>
          <Progress
            value={stats.pending.percentage}
            className="h-2 bg-slate-100 [&>div]:bg-amber-500"
          />
        </div>

        {/* Rejected Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-slate-700">
                {t('timeEntry.rejectedHours')}
              </span>
            </div>
            <span className="text-sm font-bold text-red-700">
              {stats.rejected.hours} h
            </span>
          </div>
          <Progress
            value={stats.rejected.percentage}
            className="h-2 bg-slate-100 [&>div]:bg-red-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">
              Total
            </span>
            <span className="text-xl font-bold text-slate-900">
              {stats.total.hours} h
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
