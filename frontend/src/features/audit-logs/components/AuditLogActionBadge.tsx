import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AuditAction } from '@/services/auditLogs.service';
import {
  PlusCircle,
  Edit3,
  Trash2,
  LogIn,
  LogOut,
  AlertTriangle,
  ShieldAlert,
  Eye,
  FileSpreadsheet,
  UserCheck,
  UserX,
} from 'lucide-react';

interface AuditLogActionBadgeProps {
  action: AuditAction | string;
}

export const AuditLogActionBadge: React.FC<AuditLogActionBadgeProps> = ({ action }) => {
  const normalized = (action || '').toUpperCase();

  switch (normalized) {
    case 'CREATE':
      return (
        <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 gap-1 text-[11px]">
          <PlusCircle className="h-3 w-3" /> CREATE
        </Badge>
      );
    case 'UPDATE':
      return (
        <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20 gap-1 text-[11px]">
          <Edit3 className="h-3 w-3" /> UPDATE
        </Badge>
      );
    case 'DELETE':
      return (
        <Badge variant="destructive" className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20 gap-1 text-[11px]">
          <Trash2 className="h-3 w-3" /> DELETE
        </Badge>
      );
    case 'LOGIN':
      return (
        <Badge variant="outline" className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20 gap-1 text-[11px]">
          <LogIn className="h-3 w-3" /> LOGIN
        </Badge>
      );
    case 'LOGOUT':
      return (
        <Badge variant="outline" className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20 gap-1 text-[11px]">
          <LogOut className="h-3 w-3" /> LOGOUT
        </Badge>
      );
    case 'AUTH_FAILURE':
      return (
        <Badge variant="destructive" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20 gap-1 text-[11px]">
          <AlertTriangle className="h-3 w-3" /> AUTH_FAILURE
        </Badge>
      );
    case 'ACCESS_DENIED':
      return (
        <Badge variant="destructive" className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20 gap-1 text-[11px]">
          <ShieldAlert className="h-3 w-3" /> ACCESS_DENIED
        </Badge>
      );
    case 'READ':
      return (
        <Badge variant="outline" className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20 gap-1 text-[11px]">
          <Eye className="h-3 w-3" /> READ
        </Badge>
      );
    case 'EXPORT':
      return (
        <Badge variant="outline" className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/20 gap-1 text-[11px]">
          <FileSpreadsheet className="h-3 w-3" /> EXPORT
        </Badge>
      );
    case 'ROLE_ASSIGN':
      return (
        <Badge variant="secondary" className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20 gap-1 text-[11px]">
          <UserCheck className="h-3 w-3" /> ROLE_ASSIGN
        </Badge>
      );
    case 'ROLE_REMOVE':
      return (
        <Badge variant="outline" className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20 gap-1 text-[11px]">
          <UserX className="h-3 w-3" /> ROLE_REMOVE
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs font-mono">
          {action}
        </Badge>
      );
  }
};
