import fs from 'fs';
import path from 'path';
import { pool, closeDatabasePool } from '../config/database';
import { logger } from '../utils/logger';

interface MigrationFile {
  filename: string;
  filepath: string;
  upSql: string;
  downSql: string;
}

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

const initMigrationTable = async (): Promise<void> => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

const getExecutedMigrations = async (): Promise<string[]> => {
  await initMigrationTable();
  const client = await pool.connect();
  try {
    const res = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations ORDER BY id ASC;',
    );
    return res.rows.map((row) => row.name);
  } finally {
    client.release();
  }
};

const parseMigrationFile = (filepath: string, filename: string): MigrationFile => {
  const content = fs.readFileSync(filepath, 'utf8');
  const upIndex = content.indexOf('-- UP');
  const downIndex = content.indexOf('-- DOWN');

  let upSql = '';
  let downSql = '';

  if (upIndex !== -1 && downIndex !== -1) {
    if (upIndex < downIndex) {
      upSql = content.substring(upIndex + 5, downIndex).trim();
      downSql = content.substring(downIndex + 7).trim();
    } else {
      downSql = content.substring(downIndex + 7, upIndex).trim();
      upSql = content.substring(upIndex + 5).trim();
    }
  } else if (upIndex !== -1) {
    upSql = content.substring(upIndex + 5).trim();
  } else {
    upSql = content.trim();
  }

  return { filename, filepath, upSql, downSql };
};

const getMigrationFiles = (): MigrationFile[] => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((filename) => parseMigrationFile(path.join(MIGRATIONS_DIR, filename), filename));
};

export const migrateUp = async (): Promise<void> => {
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !executed.includes(f.filename));

  if (pending.length === 0) {
    logger.info('No pending migrations to run.');
    return;
  }

  for (const migration of pending) {
    logger.info(`Executing UP migration: ${migration.filename}`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (migration.upSql) {
        await client.query(migration.upSql);
      }
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1);', [migration.filename]);
      await client.query('COMMIT');
      logger.info(`Successfully applied migration: ${migration.filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error, migration: migration.filename }, 'Migration failed, transaction rolled back');
      throw error;
    } finally {
      client.release();
    }
  }
};

export const migrateDown = async (): Promise<void> => {
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();

  if (executed.length === 0) {
    logger.info('No executed migrations to rollback.');
    return;
  }

  const lastExecutedName = executed[executed.length - 1];
  const migration = files.find((f) => f.filename === lastExecutedName);

  if (!migration) {
    throw new Error(`Migration file for executed migration ${lastExecutedName} not found.`);
  }

  if (!migration.downSql) {
    throw new Error(`Migration ${migration.filename} does not contain a -- DOWN section.`);
  }

  logger.info(`Executing DOWN rollback migration: ${migration.filename}`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migration.downSql);
    await client.query('DELETE FROM schema_migrations WHERE name = $1;', [migration.filename]);
    await client.query('COMMIT');
    logger.info(`Successfully rolled back migration: ${migration.filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error, migration: migration.filename }, 'Rollback failed, transaction rolled back');
    throw error;
  } finally {
    client.release();
  }
};

export const migrationStatus = async (): Promise<void> => {
  const executed = await getExecutedMigrations();
  const files = getMigrationFiles();

  logger.info('=== MIGRATION STATUS ===');
  for (const file of files) {
    const isExecuted = executed.includes(file.filename);
    logger.info(`[${isExecuted ? 'EXECUTED' : 'PENDING'}] ${file.filename}`);
  }
};

const runCli = async () => {
  const command = process.argv[2] || 'up';
  try {
    if (command === 'up') {
      await migrateUp();
    } else if (command === 'down') {
      await migrateDown();
    } else if (command === 'status') {
      await migrationStatus();
    } else {
      logger.error(`Unknown migration command: ${command}. Use 'up', 'down', or 'status'.`);
    }
  } catch (err) {
    logger.error({ err }, 'Migration command failed');
    process.exitCode = 1;
  } finally {
    await closeDatabasePool();
  }
};

if (require.main === module) {
  void runCli();
}
