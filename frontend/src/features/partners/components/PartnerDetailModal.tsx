import React from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Partner } from '@/services/partners.service';
import { formatDate } from '@/lib/utils/formatters';

interface PartnerDetailModalProps {
  partner: Partner | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({ partner, isOpen, onClose }) => {
  if (!partner) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
      title="Partner Profile Details"
      description="Detailed identity, contact info, and status for this business entity."
      className="max-w-md"
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0 border border-primary/20">
            {partner.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground truncate">{partner.name}</span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {partner.email || 'No email registered'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border p-3 rounded-lg bg-card">
          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Partner Type</span>
            <Badge variant="outline" className="font-semibold uppercase tracking-wider text-[10px] capitalize">
              {partner.type}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-1">Account Status</span>
            <Badge variant={partner.status === 'active' ? 'active' : 'secondary'} className="capitalize text-[10px]">
              {partner.status}
            </Badge>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Phone Number</span>
            <span className="font-medium text-foreground">{partner.phone || 'Not provided'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
            <span className="font-mono text-[10px] text-foreground truncate block">
              {partner.organization_id || 'System Default'}
            </span>
          </div>

          <div className="col-span-2">
            <span className="text-[11px] text-muted-foreground block mb-0.5">Business Address</span>
            <span className="font-medium text-foreground">{partner.address || 'No address provided'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Created Date</span>
            <span className="font-mono text-foreground">{partner.created_at ? formatDate(partner.created_at) : 'N/A'}</span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground block mb-0.5">Last Updated</span>
            <span className="font-mono text-foreground">{partner.updated_at ? formatDate(partner.updated_at) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
