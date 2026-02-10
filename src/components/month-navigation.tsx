import { Button } from '@/components/ui/button'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

interface MonthNavigationProps {
  currentDate: Date
  onDateChange: (date: Date) => void
}

export function MonthNavigation({
  currentDate,
  onDateChange,
}: MonthNavigationProps) {
  const handlePrevious = () => onDateChange(subMonths(currentDate, 1))
  const handleNext = () => onDateChange(addMonths(currentDate, 1))

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-lg border shadow-sm gap-4">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="bg-indigo-100 p-2 rounded-md shrink-0">
          <CalendarIcon className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            Periodo seleccionado
          </span>
          <h2 className="text-xl font-bold capitalize text-slate-900 leading-none">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          className="h-9 px-3"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          className="h-9 px-3"
          aria-label="Mes siguiente"
        >
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
