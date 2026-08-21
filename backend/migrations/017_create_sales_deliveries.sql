-- Migration: 017_create_sales_deliveries.sql
-- Description: Create sales_deliveries table with organization isolation, status tracking, and indexes.

CREATE TABLE IF NOT EXISTS sales_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    delivery_number VARCHAR(100) NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'picking', 'packed', 'shipped', 'delivered', 'cancelled')),
    delivery_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sales_deliveries_org_number UNIQUE (organization_id, delivery_number)
);

CREATE INDEX IF NOT EXISTS idx_sales_deliveries_org_id ON sales_deliveries(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_deliveries_sales_order_id ON sales_deliveries(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_sales_deliveries_warehouse_id ON sales_deliveries(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_sales_deliveries_status ON sales_deliveries(status);
