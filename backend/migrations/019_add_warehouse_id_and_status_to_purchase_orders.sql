-- Migration: 019_add_warehouse_id_and_status_to_purchase_orders.sql
-- Description: Add warehouse_id to purchase_orders and update status check constraint for partially_received state.

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_org_warehouse ON purchase_orders(organization_id, warehouse_id);

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_status_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'processing', 'partially_received', 'received', 'completed', 'cancelled'));
