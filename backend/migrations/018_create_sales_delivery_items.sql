-- Migration: 018_create_sales_delivery_items.sql
-- Description: Create sales_delivery_items table with quantity constraints and foreign keys.

CREATE TABLE IF NOT EXISTS sales_delivery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    delivery_id UUID NOT NULL REFERENCES sales_deliveries(id) ON DELETE CASCADE,
    sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_delivery_items_org_id ON sales_delivery_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_items_delivery_id ON sales_delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_items_so_item_id ON sales_delivery_items(sales_order_item_id);
CREATE INDEX IF NOT EXISTS idx_sales_delivery_items_product_id ON sales_delivery_items(product_id);
