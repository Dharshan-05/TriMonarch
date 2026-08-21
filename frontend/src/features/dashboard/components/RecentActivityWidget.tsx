import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RecentActivityItem } from '../types/dashboard.types';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/lib/utils/formatters';

interface RecentActivityWidgetProps {
  items?: RecentActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  items = [],
  isLoading = false,
  isError = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-elevation-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36 mb-1" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="shadow-elevation-sm border-destructive/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Audit & Operational Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Unable to retrieve audit log timeline.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elevation-sm flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Recent Operational Activity
          </CardTitle>
          <CardDescription className="text-xs">Audit log event stream</CardDescription>
        </div>
        <Link to="/audit" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Audit Trail <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="text-center py-6 border rounded-md bg-muted/20">
            <p className="text-xs text-muted-foreground">No recent audit log entries available.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-surface text-xs space-x-3"
              >
                <div className="flex flex-col min-w-0">
                  <div className="font-semibold text-foreground truncate">{item.action}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    by <span className="font-medium text-foreground">{item.actor}</span> on{' '}
                    <span className="font-mono">{item.entity}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 space-y-1">
                  <Badge variant={item.status === 'success' || item.status === 'info' ? 'active' : 'warning'}>
                    {item.action.split('_')[0] || 'Event'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">{formatDate(item.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
