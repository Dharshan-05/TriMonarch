import { PoolClient } from 'pg';
import { auditService } from '../audit/audit.service';
import { AuditLog } from '../audit/audit.types';
import { redactSensitiveData } from '../audit/audit.utils';
import { BusinessEventInput } from '../events/businessEvent.types';
import { getBusinessEventDefinition } from '../events/businessEvent.registry';
import { emitBusinessEventSchema } from '../schemas/businessEvent.schema';
import { ValidationError } from '../types';

export class BusinessEventService {
  async emit(input: BusinessEventInput, client?: PoolClient): Promise<AuditLog | null> {
    const parseResult = emitBusinessEventSchema.safeParse(input);
    if (!parseResult.success) {
      throw new ValidationError(
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const definition = getBusinessEventDefinition(input.eventName);
    const effectiveClient = input.client || client;
    const userId = input.user_id || input.actor_id || null;
    const entityType = input.entity_type || definition.entityType;

    const mergedMetadata: Record<string, unknown> = {
      event: input.eventName,
      ...(input.metadata || {}),
    };

    const beforeSnap = input.before_snapshot || input.before || null;
    const afterSnap = input.after_snapshot || input.after || null;

    const sanitizedMetadata = (redactSensitiveData(mergedMetadata) || {}) as Record<string, unknown>;
    const sanitizedBefore = beforeSnap ? ((redactSensitiveData(beforeSnap) || {}) as Record<string, unknown>) : null;
    const sanitizedAfter = afterSnap ? ((redactSensitiveData(afterSnap) || {}) as Record<string, unknown>) : null;

    return auditService.recordAuditEvent(
      {
        organization_id: input.organization_id,
        user_id: userId,
        category: definition.category,
        action: definition.action,
        entity_type: entityType,
        entity_id: input.entity_id || null,
        request_id: input.request_id || null,
        correlation_id: input.correlation_id || null,
        reason: input.reason || null,
        before_snapshot: sanitizedBefore,
        after_snapshot: sanitizedAfter,
        metadata: sanitizedMetadata,
      },
      effectiveClient,
    );
  }
}

export const businessEventService = new BusinessEventService();
