import { z } from 'zod';

export const createRoleSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().optional().nullable(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
});

export const userRoleParamSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
  roleId: z.string().uuid({ message: 'roleId must be a valid UUID' }),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid({ message: 'userId must be a valid UUID' }),
});
