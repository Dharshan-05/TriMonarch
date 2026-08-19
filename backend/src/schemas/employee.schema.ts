import { z } from 'zod';

export const createEmployeeSchema = z.object({
  organization_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional().nullable(),
  employee_code: z.string().min(1, 'employee_code is required').max(50),
  first_name: z.string().min(1, 'first_name is required').max(100),
  last_name: z.string().min(1, 'last_name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().nullable(),
  employment_status: z
    .enum(['active', 'inactive', 'terminated', 'on_leave'])
    .optional()
    .default('active'),
  joining_date: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  job_title: z.string().optional().nullable(),
  employment_status: z.enum(['active', 'inactive', 'terminated', 'on_leave']).optional(),
  joining_date: z.string().optional(),
});
