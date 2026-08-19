import { pool, closeDatabasePool } from '../config/database';
import { logger } from '../utils/logger';
import { hashPassword } from '../utils/password';

export const seedDatabase = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    logger.info('Starting database seeding...');
    await client.query('BEGIN');

    // 1. Seed Organization
    const orgRes = await client.query<{ id: string }>(`
      INSERT INTO organizations (name, code, description, status)
      VALUES ('ACME Corporation', 'ACME_CORP', 'Main development organization tenant', 'active')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `);
    const orgId = orgRes.rows[0]?.id;
    if (!orgId) throw new Error('Failed to seed organization');

    // 2. Seed User
    const defaultPasswordHash = await hashPassword('Password123!');
    const userRes = await client.query<{ id: string }>(`
      INSERT INTO users (organization_id, name, email, phone, status, password_hash)
      VALUES ($1, 'Admin User', 'admin@acme.com', '+15550100', 'active', $2)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
      RETURNING id;
    `, [orgId, defaultPasswordHash]);
    const userId = userRes.rows[0]?.id;
    if (!userId) throw new Error('Failed to seed user');

    // 3. Seed Role
    const roleRes = await client.query<{ id: string }>(`
      INSERT INTO roles (organization_id, name, code, description)
      VALUES ($1, 'Administrator', 'ADMIN', 'Full system access administrator role')
      ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [orgId]);
    const roleId = roleRes.rows[0]?.id;
    if (!roleId) throw new Error('Failed to seed role');

    // 4. Seed User Role
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `, [userId, roleId]);

    // 5. Seed Department
    const deptRes = await client.query<{ id: string }>(`
      INSERT INTO departments (organization_id, name, code, description, status)
      VALUES ($1, 'Engineering', 'ENG', 'Product Development & Engineering', 'active')
      ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [orgId]);
    const deptId = deptRes.rows[0]?.id;
    if (!deptId) throw new Error('Failed to seed department');

    // 6. Seed Employee
    await client.query(`
      INSERT INTO employees (organization_id, user_id, employee_code, first_name, last_name, email, department_id, job_title, employment_status)
      VALUES ($1, $2, 'EMP-001', 'John', 'Doe', 'john.doe@acme.com', $3, 'Lead Software Engineer', 'active')
      ON CONFLICT (organization_id, employee_code) DO UPDATE SET first_name = EXCLUDED.first_name;
    `, [orgId, userId, deptId]);

    // 7. Seed Product
    const prodRes = await client.query<{ id: string }>(`
      INSERT INTO products (organization_id, sku, name, description, category, unit, status)
      VALUES ($1, 'WGT-001', 'Widget Alpha', 'High quality industrial widget', 'Electronics', 'pcs', 'active')
      ON CONFLICT (organization_id, sku) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [orgId]);
    const prodId = prodRes.rows[0]?.id;
    if (!prodId) throw new Error('Failed to seed product');

    // 8. Seed Warehouse
    const whRes = await client.query<{ id: string }>(`
      INSERT INTO warehouses (organization_id, name, code, location, status)
      VALUES ($1, 'Central Warehouse', 'WH-CENTRAL', 'Building A, Industrial Park', 'active')
      ON CONFLICT (organization_id, code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id;
    `, [orgId]);
    const whId = whRes.rows[0]?.id;
    if (!whId) throw new Error('Failed to seed warehouse');

    // 9. Seed Inventory
    await client.query(`
      INSERT INTO inventory (organization_id, product_id, warehouse_id, quantity, reorder_level)
      VALUES ($1, $2, $3, 100.00, 10.00)
      ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity;
    `, [orgId, prodId, whId]);

    // 10. Seed Customer
    await client.query(`
      INSERT INTO customers (organization_id, name, email, phone, address, status)
      VALUES ($1, 'Global Tech Inc', 'contact@globaltech.com', '+15550200', '100 Tech Blvd, Silicon Valley, CA', 'active');
    `, [orgId]);

    // 11. Seed Supplier
    await client.query(`
      INSERT INTO suppliers (organization_id, name, email, phone, address, status)
      VALUES ($1, 'Components Corp', 'sales@componentscorp.com', '+15550300', '50 Industrial Way, Austin, TX', 'active');
    `, [orgId]);

    await client.query('COMMIT');
    logger.info('Database seeding completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Database seeding failed');
    throw error;
  } finally {
    client.release();
  }
};

const runCli = async () => {
  try {
    await seedDatabase();
  } catch (err) {
    logger.error({ err }, 'Seed CLI execution failed');
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
};

if (require.main === module) {
  void runCli();
}
