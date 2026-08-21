import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AuditEntityType } from '@/services/auditLogs.service';
import {
  Building2,
  User,
  Shield,
  Briefcase,
  Users,
  Package,
  Warehouse,
  Boxes,
  UserCheck,
  Truck,
  ShoppingCart,
  Receipt,
  FileText,
  CreditCard,
  Layers,
  Factory,
  CheckCircle2,
  Activity,
  Key,
  Database,
} from 'lucide-react';

interface AuditLogEntityTypeBadgeProps {
  entityType: AuditEntityType | string;
}

export const AuditLogEntityTypeBadge: React.FC<AuditLogEntityTypeBadgeProps> = ({ entityType }) => {
  const normalized = (entityType || '').toUpperCase();

  const getIcon = () => {
    switch (normalized) {
      case 'ORGANIZATION': return <Building2 className="h-3 w-3" />;
      case 'USER': return <User className="h-3 w-3" />;
      case 'ROLE': return <Shield className="h-3 w-3" />;
      case 'DEPARTMENT': return <Briefcase className="h-3 w-3" />;
      case 'EMPLOYEE': return <Users className="h-3 w-3" />;
      case 'PRODUCT': return <Package className="h-3 w-3" />;
      case 'WAREHOUSE': return <Warehouse className="h-3 w-3" />;
      case 'INVENTORY': return <Boxes className="h-3 w-3" />;
      case 'CUSTOMER': return <UserCheck className="h-3 w-3" />;
      case 'SUPPLIER': return <Truck className="h-3 w-3" />;
      case 'SALES_ORDER': return <ShoppingCart className="h-3 w-3" />;
      case 'SALES_DELIVERY': return <Truck className="h-3 w-3" />;
      case 'PURCHASE_ORDER': return <Receipt className="h-3 w-3" />;
      case 'PURCHASE_RECEIPT': return <FileText className="h-3 w-3" />;
      case 'SUPPLIER_INVOICE': return <FileText className="h-3 w-3" />;
      case 'SUPPLIER_PAYMENT': return <CreditCard className="h-3 w-3" />;
      case 'BOM': return <Layers className="h-3 w-3" />;
      case 'MANUFACTURING_ORDER': return <Factory className="h-3 w-3" />;
      case 'AUTHENTICATION': return <Key className="h-3 w-3" />;
      case 'SESSION': return <Activity className="h-3 w-3" />;
      case 'AUDIT_LOG': return <Database className="h-3 w-3" />;
      default: return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  return (
    <Badge variant="outline" className="gap-1 font-mono text-[11px] bg-muted/30 text-foreground border-border">
      {getIcon()}
      <span>{entityType}</span>
    </Badge>
  );
};
