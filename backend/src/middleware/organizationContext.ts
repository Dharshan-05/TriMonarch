import { Request } from 'express';
import { z } from 'zod';
import { ValidationError } from '../types';

const uuidSchema = z.string().uuid({ message: 'Invalid organizationId UUID format' });

export const getOrganizationId = (req: Request): string => {
  // If request is authenticated, trust req.auth.organizationId
  if (req.auth?.organizationId) {
    const trustedOrgId = req.auth.organizationId;

    // Check if client tried to override with a conflicting organization ID
    const orgHeader = req.headers['x-organization-id'];
    const orgQuery = req.query.organizationId;
    const requestedOrgId = typeof orgHeader === 'string' && orgHeader.trim().length > 0
      ? orgHeader.trim()
      : typeof orgQuery === 'string' && orgQuery.trim().length > 0
        ? orgQuery.trim()
        : undefined;

    if (requestedOrgId && requestedOrgId !== trustedOrgId) {
      throw new ValidationError(
        'Cross-organization access denied: requested organizationId does not match authenticated tenant',
      );
    }

    return trustedOrgId;
  }

  // Fallback for unauthenticated requests
  const orgHeader = req.headers['x-organization-id'];
  const orgQuery = req.query.organizationId;

  const rawOrgId = typeof orgHeader === 'string' && orgHeader.trim().length > 0
    ? orgHeader.trim()
    : typeof orgQuery === 'string' && orgQuery.trim().length > 0
      ? orgQuery.trim()
      : undefined;

  if (!rawOrgId) {
    throw new ValidationError(
      'Organization context is required. Provide x-organization-id header or organizationId query parameter.',
    );
  }

  const result = uuidSchema.safeParse(rawOrgId);
  if (!result.success) {
    throw new ValidationError('Invalid organizationId UUID format', result.error.flatten().fieldErrors);
  }

  return result.data;
};
