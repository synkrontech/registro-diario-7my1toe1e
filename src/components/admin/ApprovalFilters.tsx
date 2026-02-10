import { ApprovalFiltersState, Client, UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Check, ChevronsUpDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateLocale } from '@/components/LanguageSelector'
import { useEffect, useState } from 'react'

interface ApprovalFiltersProps {
  filters: ApprovalFiltersState
  onFilterChange: (filters: ApprovalFiltersState) => void
  clients: Client[]
  consultants: UserProfile[]
  showStatusFilter?: boolean
}

export function ApprovalFilters({
  filters,
  onFilterChange,
  clients,
  consultants,
  showStatusFilter = false,
}: ApprovalFiltersProps) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
  const [openClient, setOpenClient] = useState(false)
  const [openConsultant, setOpenConsultant] = useState(false)

  const handleDateSelect = (range: any) => {
    onFilterChange({ ...filters, dateRange: range })
  }

  const clearFilters = () => {
    onFilterChange({
      dateRange: undefined,
      clientId: null,
      consultantId: null,
      status: showStatusFilter ? 'all' : filters.status,
    })
  }

  const selectedClient = clients.find((c) => c.id === filters.clientId)
  const selectedConsultant = consultants.find(
    (c) => c.id === filters.consultantId,
  )

  return (
    <div className="flex flex-col gap-4 bg-slate-50 p-4 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-slate-700">
          {t('approvals.filters.title')}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-muted-foreground hover:text-slate-900"
        >
          {t('common.clear')}
          <X className="ml-2 h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range Picker */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            {t('approvals.filters.dateRange')}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal bg-white',
                  !filters.dateRange && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'P', {
                        locale: dateLocale,
                      })}{' '}
                      -{' '}
                      {format(filters.dateRange.to, 'P', {
                        locale: dateLocale,
                      })}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'P', { locale: dateLocale })
                  )
                ) : (
                  <span>{t('approvals.filters.pickDate')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={filters.dateRange}
                onSelect={handleDateSelect}
                initialFocus
                locale={dateLocale}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Client Combobox */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            {t('approvals.filters.client')}
          </label>
          <Popover open={openClient} onOpenChange={setOpenClient}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openClient}
                className="w-full justify-between bg-white font-normal"
              >
                {selectedClient
                  ? selectedClient.nombre
                  : t('approvals.filters.selectClient')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder={t('common.search')} />
                <CommandList>
                  <CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all_clients"
                      onSelect={() => {
                        onFilterChange({ ...filters, clientId: null })
                        setOpenClient(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !filters.clientId ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {t('common.all')}
                    </CommandItem>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.nombre}
                        onSelect={() => {
                          onFilterChange({ ...filters, clientId: client.id })
                          setOpenClient(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.clientId === client.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {client.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Consultant Combobox */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500">
            {t('approvals.filters.consultant')}
          </label>
          <Popover open={openConsultant} onOpenChange={setOpenConsultant}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openConsultant}
                className="w-full justify-between bg-white font-normal"
              >
                {selectedConsultant
                  ? `${selectedConsultant.nombre} ${selectedConsultant.apellido}`
                  : t('approvals.filters.selectConsultant')}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder={t('common.search')} />
                <CommandList>
                  <CommandEmpty>No consultant found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all_consultants"
                      onSelect={() => {
                        onFilterChange({ ...filters, consultantId: null })
                        setOpenConsultant(false)
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          !filters.consultantId ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {t('common.all')}
                    </CommandItem>
                    {consultants.map((consultant) => (
                      <CommandItem
                        key={consultant.id}
                        value={`${consultant.nombre} ${consultant.apellido}`}
                        onSelect={() => {
                          onFilterChange({
                            ...filters,
                            consultantId: consultant.id,
                          })
                          setOpenConsultant(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filters.consultantId === consultant.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {consultant.nombre} {consultant.apellido}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status Filter - Only shown for history */}
        {showStatusFilter && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500">
              {t('approvals.filters.status')}
            </label>
            <Select
              value={filters.status}
              onValueChange={(val: any) =>
                onFilterChange({ ...filters, status: val })
              }
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="aprobado">
                  {t('enums.timeEntryStatus.aprobado')}
                </SelectItem>
                <SelectItem value="rechazado">
                  {t('enums.timeEntryStatus.rechazado')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
