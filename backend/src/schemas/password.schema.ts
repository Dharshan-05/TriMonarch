import { z } from 'zod';

export const passwordPolicySchema = z
  .string({ required_error: 'Password is required' })
  .min(12, { message: 'Password must be at least 12 characters long' })
  .max(128, { message: 'Password must not exceed 128 characters' })
  .refine((val) => val.trim().length > 0, {
    message: 'Password must not be empty or whitespace only',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'Current password is required' }).min(1, { message: 'Current password is required' }),
    newPassword: passwordPolicySchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

export const resetPasswordRequestSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
});

export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required' }),
  newPassword: passwordPolicySchema,
});
