import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AuditLog, AuditStats } from '@/services/auditLogs.service';
import { Activity, ShieldCheck, AlertOctagon, Layers } from 'lucide-react';

interface AuditLogKpiGridProps {
  logs?: AuditLog[];
  stats?: AuditStats;
  totalRecords?: number;
}

export const AuditLogKpiGrid: React.FC<AuditLogKpiGridProps> = ({
  logs = [],
  stats,
  totalRecords = 0,
}) => {
  const displayTotal = stats?.totalLogs ?? totalRecords ?? logs.length;
  
  // Calculate breakdown from stats or current page items safely
  const createCount = stats?.actionBreakdown?.find((a) => a.action === 'CREATE')?.count ??
    logs.filter((l) => l.action === 'CREATE').length;

  const updateCount = stats?.actionBreakdown?.find((a) => a.action === 'UPDATE')?.count ??
    logs.filter((l) => l.action === 'UPDATE').length;

  const deleteCount = stats?.actionBreakdown?.find((a) => a.action === 'DELETE')?.count ??
    logs.filter((l) => l.action === 'DELETE').length;

  const authFailCount = stats?.actionBreakdown?.find((a) => a.action === 'AUTH_FAILURE' || a.action === 'ACCESS_DENIED')?.count ??
    logs.filter((l) => l.action === 'AUTH_FAILURE' || l.action === 'ACCESS_DENIED' || !l.success).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Audit Trail Events */}
      <Card className="shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Audit Events
            </span>
            <div className="text-2xl font-bold text-foreground font-mono">
              {displayTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground">Recorded Operational History</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Creation Events */}
      <Card className="shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Create Operations
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {createCount.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground">Resource Inceptions</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Update & Mutation Events */}
      <Card className="shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Update Operations
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {updateCount.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground">State Changes ({deleteCount} Deletions)</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Auth / Security Alerts */}
      <Card className="shadow-subtle border">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Security & Auth Alerts
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {authFailCount.toLocaleString()}
            </div>
            <span className="text-[11px] text-muted-foreground">Denied & Failed Requests</span>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertOctagon className="h-5 w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
