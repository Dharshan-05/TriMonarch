import React from 'react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLog } from '@/services/auditLogs.service';
import { AuditLogActionBadge } from './AuditLogActionBadge';
import { AuditLogEntityTypeBadge } from './AuditLogEntityTypeBadge';
import { formatDate } from '@/lib/utils/formatters';
import { Eye, CheckCircle2, XCircle, User } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading?: boolean;
  onViewDetails: (log: AuditLog) => void;
}

export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  logs,
  isLoading = false,
  onViewDetails,
}) => {
  if (isLoading) {
    return (
      <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor / User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell align="right"><Skeleton className="h-8 w-12 ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">No audit events found</h3>
        <p className="text-xs text-muted-foreground">Try adjusting search parameters, date range, or action filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden bg-card shadow-subtle">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actor / User ID</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity Reference</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead align="right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
              <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {formatDate(log.created_at)}
              </TableCell>

              <TableCell className="text-xs font-mono text-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate max-w-[140px]" title={log.user_id || log.actor_id || 'System'}>
                    {log.user_id || log.actor_id || 'SYSTEM'}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <AuditLogActionBadge action={log.action} />
              </TableCell>

              <TableCell>
                <AuditLogEntityTypeBadge entityType={log.entity_type} />
              </TableCell>

              <TableCell className="font-mono text-xs text-muted-foreground">
                {log.entity_id ? (
                  <span className="truncate max-w-[150px] inline-block" title={log.entity_id}>
                    {log.entity_id}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </TableCell>

              <TableCell>
                {log.success ? (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>SUCCESS</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>FAILED</span>
                  </div>
                )}
              </TableCell>

              <TableCell align="right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails(log)}
                  className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  title="View Complete Audit Payload & Snapshots"
                >
                  <Eye className="h-3.5 w-3.5" /> Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
