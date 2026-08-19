import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '../types/database';
import {
  PaginationParams,
  PaginatedResult,
  buildPaginationClause,
  createPaginatedResult,
} from './base/pagination';

export class EmployeeRepository {
  async create(data: CreateEmployeeInput, client?: PoolClient): Promise<Employee> {
    const rows = await query<Employee>(
      `INSERT INTO employees (
        organization_id, user_id, employee_code, first_name, last_name, email,
        phone, department_id, job_title, employment_status, joining_date
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *;`,
      [
        data.organization_id,
        data.user_id || null,
        data.employee_code,
        data.first_name,
        data.last_name,
        data.email,
        data.phone || null,
        data.department_id || null,
        data.job_title || null,
        data.employment_status || 'active',
        data.joining_date || new Date(),
      ],
      client,
    );
    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<Employee | null> {
    return queryOne<Employee>(
      'SELECT * FROM employees WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  async findByEmployeeCode(
    organizationId: string,
    employeeCode: string,
    client?: PoolClient,
  ): Promise<Employee | null> {
    return queryOne<Employee>(
      'SELECT * FROM employees WHERE employee_code = $1 AND organization_id = $2;',
      [employeeCode, organizationId],
      client,
    );
  }

  async listByOrganization(
    organizationId: string,
    params?: PaginationParams & { departmentId?: string; status?: string },
    client?: PoolClient,
  ): Promise<PaginatedResult<Employee>> {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.departmentId) {
      conditions.push(`department_id = $${idx++}`);
      values.push(params.departmentId);
    }

    if (params?.status) {
      conditions.push(`employment_status = $${idx++}`);
      values.push(params.status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM employees ${whereClause};`,
      values,
      client,
    );
    const total = parseInt(countRes[0]?.count || '0', 10);

    const pagination = buildPaginationClause({
      params,
      allowedSortFields: ['first_name', 'last_name', 'employee_code', 'joining_date', 'created_at'],
      defaultSortBy: 'first_name',
    });

    const items = await query<Employee>(
      `SELECT * FROM employees ${whereClause} ${pagination.sql};`,
      values,
      client,
    );

    return createPaginatedResult(items, total, pagination.page, pagination.pageSize);
  }

  async listByDepartment(
    organizationId: string,
    departmentId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<Employee>> {
    return this.listByOrganization(organizationId, { ...params, departmentId }, client);
  }

  async update(
    organizationId: string,
    id: string,
    data: UpdateEmployeeInput,
    client?: PoolClient,
  ): Promise<Employee | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.user_id !== undefined) {
      fields.push(`user_id = $${idx++}`);
      values.push(data.user_id);
    }
    if (data.first_name !== undefined) {
      fields.push(`first_name = $${idx++}`);
      values.push(data.first_name);
    }
    if (data.last_name !== undefined) {
      fields.push(`last_name = $${idx++}`);
      values.push(data.last_name);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone);
    }
    if (data.department_id !== undefined) {
      fields.push(`department_id = $${idx++}`);
      values.push(data.department_id);
    }
    if (data.job_title !== undefined) {
      fields.push(`job_title = $${idx++}`);
      values.push(data.job_title);
    }
    if (data.employment_status !== undefined) {
      fields.push(`employment_status = $${idx++}`);
      values.push(data.employment_status);
    }
    if (data.joining_date !== undefined) {
      fields.push(`joining_date = $${idx++}`);
      values.push(data.joining_date);
    }

    if (fields.length === 0) {
      return this.findById(organizationId, id, client);
    }

    values.push(id, organizationId);
    const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx++} AND organization_id = $${idx} RETURNING *;`;
    return queryOne<Employee>(sql, values, client);
  }

  async delete(organizationId: string, id: string, client?: PoolClient): Promise<boolean> {
    const rows = await query<{ id: string }>(
      'DELETE FROM employees WHERE id = $1 AND organization_id = $2 RETURNING id;',
      [id, organizationId],
      client,
    );
    return rows.length > 0;
  }
}

export const employeeRepository = new EmployeeRepository();
