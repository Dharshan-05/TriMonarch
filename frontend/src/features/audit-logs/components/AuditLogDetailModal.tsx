import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@/services/auditLogs.service';
import { AuditLogActionBadge } from './AuditLogActionBadge';
import { AuditLogEntityTypeBadge } from './AuditLogEntityTypeBadge';
import { formatDate } from '@/lib/utils/formatters';
import { ShieldCheck, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasSnapshots = Boolean(log.before_snapshot || log.after_snapshot);
  const hasMetadata = Object.keys(log.metadata || {}).length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Audit Event Inspector"
      description="Immutable security audit log entry and historical state change snapshot."
      className="max-w-3xl max-h-[90vh] overflow-y-auto"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyJson}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied Payload' : 'Copy JSON Payload'}
          </Button>

          <Button size="sm" variant="secondary" onClick={onClose} className="h-8 text-xs">
            Close Inspector
          </Button>
        </div>
      }
    >
      <div className="space-y-5 py-2 text-xs">
        {/* Header Summary Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-card shadow-subtle">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-mono text-xs font-bold text-foreground">Audit ID: {log.id}</div>
              <div className="text-[11px] text-muted-foreground">{formatDate(log.created_at)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {log.success ? (
              <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 text-[11px]">
                <CheckCircle2 className="h-3 w-3" /> SUCCESS
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20 gap-1 text-[11px]">
                <XCircle className="h-3 w-3" /> FAILED
              </Badge>
            )}
          </div>
        </div>

        {/* Audit Attributes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-lg border bg-muted/10">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Action</span>
            <div><AuditLogActionBadge action={log.action} /></div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Entity Type</span>
            <div><AuditLogEntityTypeBadge entityType={log.entity_type} /></div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Actor / User ID</span>
            <div className="font-mono text-xs text-foreground select-all">{log.user_id || log.actor_id || 'SYSTEM'}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Entity Reference ID</span>
            <div className="font-mono text-xs text-foreground select-all">{log.entity_id || 'N/A'}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Request ID</span>
            <div className="font-mono text-xs text-muted-foreground select-all">{log.request_id || 'N/A'}</div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Correlation ID</span>
            <div className="font-mono text-xs text-muted-foreground select-all">{log.correlation_id || 'N/A'}</div>
          </div>
        </div>

        {/* Reason / Context */}
        {log.reason && (
          <div className="space-y-1.5 p-3 rounded-lg border bg-card">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Reason / Operation Context</span>
            <p className="text-xs text-foreground font-medium">{log.reason}</p>
          </div>
        )}

        {/* Before & After State Snapshots */}
        {hasSnapshots && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              State Mutation Snapshots
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Before Snapshot */}
              <div className="p-3 rounded-lg border bg-card space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase text-amber-600 dark:text-amber-400">
                  Before Snapshot
                </span>
                {log.before_snapshot ? (
                  <pre className="p-2.5 rounded bg-muted/40 font-mono text-[11px] overflow-x-auto max-h-48 border text-muted-foreground">
                    {JSON.stringify(log.before_snapshot, null, 2)}
                  </pre>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground/60 italic border rounded bg-muted/10">
                    No prior state snapshot (Initial creation)
                  </div>
                )}
              </div>

              {/* After Snapshot */}
              <div className="p-3 rounded-lg border bg-card space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase text-emerald-600 dark:text-emerald-400">
                  After Snapshot
                </span>
                {log.after_snapshot ? (
                  <pre className="p-2.5 rounded bg-muted/40 font-mono text-[11px] overflow-x-auto max-h-48 border text-foreground font-medium">
                    {JSON.stringify(log.after_snapshot, null, 2)}
                  </pre>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground/60 italic border rounded bg-muted/10">
                    No after state snapshot (Deletion or read event)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Metadata */}
        {hasMetadata && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Additional Audit Metadata
            </span>
            <pre className="p-3 rounded-lg border bg-muted/30 font-mono text-[11px] overflow-x-auto max-h-40 text-foreground">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Dialog>
  );
};
