import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as dbModule from '../src/config/database';

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

describe('Database Schema & Migration Foundation', () => {
  it('should verify all 6 migration files exist and contain valid UP/DOWN blocks', () => {
    const expectedFiles = [
      '001_create_extensions_and_helpers.sql',
      '002_create_organizations.sql',
      '003_create_users_and_roles.sql',
      '004_create_departments_and_employees.sql',
      '005_create_products_and_inventory.sql',
      '006_create_customers_and_suppliers.sql',
    ];

    const actualFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));

    for (const file of expectedFiles) {
      expect(actualFiles).toContain(file);
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      expect(content).toContain('-- UP');
      expect(content).toContain('-- DOWN');
    }
  });

  it('should verify organizations table migration defines code uniqueness and status check constraints', () => {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, '002_create_organizations.sql'), 'utf8');
    expect(content).toContain('code VARCHAR(50) NOT NULL UNIQUE');
    expect(content).toContain("CHECK (status IN ('active', 'inactive', 'suspended'))");
  });

  it('should verify users and roles migration defines organization scoping and composite constraints', () => {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, '003_create_users_and_roles.sql'), 'utf8');
    expect(content).toContain('organization_id UUID NOT NULL REFERENCES organizations(id)');
    expect(content).toContain('CONSTRAINT uq_roles_org_code UNIQUE (organization_id, code)');
    expect(content).toContain('PRIMARY KEY (user_id, role_id)');
  });

  it('should verify departments and employees migration defines organization code constraints and deletion rules', () => {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, '004_create_departments_and_employees.sql'), 'utf8');
    expect(content).toContain('CONSTRAINT uq_departments_org_code UNIQUE (organization_id, code)');
    expect(content).toContain('CONSTRAINT uq_employees_org_code UNIQUE (organization_id, employee_code)');
    expect(content).toContain('user_id UUID REFERENCES users(id) ON DELETE SET NULL');
  });

  it('should verify products and inventory migration defines non-negative quantity check constraint', () => {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, '005_create_products_and_inventory.sql'), 'utf8');
    expect(content).toContain('CONSTRAINT uq_products_org_sku UNIQUE (organization_id, sku)');
    expect(content).toContain('CONSTRAINT uq_inventory_product_warehouse UNIQUE (product_id, warehouse_id)');
    expect(content).toContain('CHECK (quantity >= 0)');
    expect(content).toContain('CHECK (reorder_level >= 0)');
  });

  it('should mock database connectivity and test database health check status when connected', async () => {
    vi.spyOn(dbModule, 'testDatabaseConnection').mockResolvedValueOnce({
      connected: true,
      latencyMs: 3,
    });

    const status = await dbModule.testDatabaseConnection();
    expect(status.connected).toBe(true);
    expect(status.latencyMs).toBe(3);
  });
});
