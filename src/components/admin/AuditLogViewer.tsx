import { AuditLog } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AuditLogViewerProps {
  logs: AuditLog[]
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Objetivo</TableHead>
            <TableHead>Detalles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No hay registros de actividad
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', {
                    locale: es,
                  })}
                </TableCell>
                <TableCell className="font-medium">{log.admin_email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-slate-50">
                    {log.action_type}
                  </Badge>
                </TableCell>
                <TableCell>{log.target_email}</TableCell>
                <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                  {JSON.stringify(log.details)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
