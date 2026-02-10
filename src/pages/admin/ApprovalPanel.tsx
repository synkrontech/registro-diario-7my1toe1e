import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/components/AuthProvider'
import { approvalService } from '@/services/approvalService'
import { adminService } from '@/services/adminService'
import { clientService } from '@/services/clientService'
import {
  ApprovalFiltersState,
  ApprovalTimeEntry,
  Client,
  UserProfile,
} from '@/lib/types'
import { ApprovalList } from '@/components/admin/ApprovalList'
import { ApprovalHistory } from '@/components/admin/ApprovalHistory'
import { ApprovalFilters } from '@/components/admin/ApprovalFilters'
import { useApprovalStore } from '@/stores/useApprovalStore'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, XCircle, FileCheck, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ApprovalPanel() {
  const { t } = useTranslation()
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const { fetchPendingCount, decrementCount } = useApprovalStore()

  const [activeTab, setActiveTab] = useState('pending')
  const [entries, setEntries] = useState<ApprovalTimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  // Filters State
  const [filters, setFilters] = useState<ApprovalFiltersState>({
    dateRange: undefined,
    clientId: null,
    consultantId: null,
    status: 'all',
  })

  // Filter Options Data
  const [clients, setClients] = useState<Client[]>([])
  const [consultants, setConsultants] = useState<UserProfile[]>([])

  const loadFilterOptions = async () => {
    try {
      const [clientsData, usersData] = await Promise.all([
        clientService.getClients(),
        adminService.getUsers(),
      ])
      setClients(clientsData)
      setConsultants(usersData.filter((u) => u.role === 'consultor'))
    } catch (err) {
      console.error('Failed to load filter options', err)
    }
  }

  const loadData = async () => {
    if (!user || !profile) return
    setLoading(true)
    try {
      let data: ApprovalTimeEntry[] = []
      if (activeTab === 'pending') {
        data = await approvalService.getPendingEntries(
          user.id,
          profile.role,
          filters,
        )
      } else {
        data = await approvalService.getHistoryEntries(
          user.id,
          profile.role,
          filters,
        )
      }
      setEntries(data)
      // Sync badge count if in pending tab
      if (activeTab === 'pending') {
        fetchPendingCount(user.id, profile.role)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorLoad'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    loadData()
  }, [user, profile, activeTab, filters])

  const handleToggleSelection = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleToggleGroup = (ids: string[]) => {
    const newSet = new Set(selectedIds)
    const allSelected = ids.every((id) => newSet.has(id))

    if (allSelected) {
      ids.forEach((id) => newSet.delete(id))
    } else {
      ids.forEach((id) => newSet.add(id))
    }
    setSelectedIds(newSet)
  }

  const handleProcess = async (
    ids: string[],
    status: 'aprobado' | 'rechazado',
  ) => {
    if (!user) return
    setProcessing(true)
    try {
      await approvalService.updateEntryStatus(ids, status, user.id)

      // Update UI optimistically
      setEntries((prev) => prev.filter((e) => !ids.includes(e.id)))
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        ids.forEach((id) => newSet.delete(id))
        return newSet
      })

      // Update global count
      decrementCount(ids.length)

      // Dynamic Toast
      const messageKey =
        status === 'aprobado'
          ? 'approvals.messages.approvedCount'
          : 'approvals.messages.rejectedCount'

      toast({
        title:
          status === 'aprobado' ? t('common.success') : t('common.updated'),
        description: t(messageKey, { count: ids.length }),
        className: status === 'aprobado' ? 'bg-green-50 border-green-200' : '',
        duration: 4000,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: t('common.error'),
        description: t('common.errorSave'),
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkApprove = () => {
    if (selectedIds.size === 0) return
    handleProcess(Array.from(selectedIds), 'aprobado')
  }

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return
    handleProcess(Array.from(selectedIds), 'rechazado')
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileCheck className="h-8 w-8 text-indigo-600" />
            {t('approvals.title')}
          </h2>
          <p className="text-muted-foreground">{t('approvals.subtitle')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="pending">{t('approvals.pending')}</TabsTrigger>
          <TabsTrigger value="history">{t('approvals.history')}</TabsTrigger>
        </TabsList>

        <div className="space-y-6">
          <ApprovalFilters
            filters={filters}
            onFilterChange={setFilters}
            clients={clients}
            consultants={consultants}
            showStatusFilter={activeTab === 'history'}
          />

          <TabsContent value="pending" className="mt-0">
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 animate-fade-in bg-white p-3 rounded-lg border shadow-sm sticky top-4 z-10">
                <span className="text-sm font-medium text-slate-600 ml-2">
                  {selectedIds.size} selected
                </span>
                <div className="flex-1" />
                <Button
                  onClick={handleBulkApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  {t('approvals.approveSelected')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleBulkReject}
                  disabled={processing}
                  size="sm"
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  {t('approvals.rejectSelected')}
                </Button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ApprovalList
                entries={entries}
                selectedIds={selectedIds}
                onToggleSelection={handleToggleSelection}
                onToggleGroup={handleToggleGroup}
                onApprove={(ids) => handleProcess(ids, 'aprobado')}
                onReject={(ids) => handleProcess(ids, 'rechazado')}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <ApprovalHistory entries={entries} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
