import { describe, it, expect, vi } from 'vitest';
import { bomStateMachineService } from '../src/services/bomStateMachine.service';
import { bomRepository } from '../src/repositories/bom.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  BomEmptyError,
  BomInvalidStateTransitionError,
  BomAlreadyInStateError,
  BomEffectiveDateError,
} from '../src/types';
import { PoolClient } from 'pg';
import { Bom, BomItem, AuditLog } from '../src/types/database';

describe('BOM State Machine (Phase 031)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const parentProdId = '44444444-4444-4444-4444-444444444444';
  const compProdId = '55555555-5555-5555-5555-555555555555';
  const bomId = '99999999-9999-9999-9999-999999999999';

  const mockClient = {
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    release: vi.fn(),
  } as unknown as PoolClient;

  vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

  const mockBom: Bom = {
    id: bomId,
    organization_id: orgAId,
    product_id: parentProdId,
    bom_number: 'BOM-001',
    bom_code: 'BOM-001',
    revision: '1',
    version: 1,
    name: 'Test BOM',
    status: 'draft',
    effective_from: null,
    effective_to: null,
    is_default: false,
    notes: null,
    created_by: userAId,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockComponent: BomItem = {
    id: 'comp-1',
    organization_id: orgAId,
    bom_id: bomId,
    component_product_id: compProdId,
    quantity: '2.0000',
    unit: 'pcs',
    scrap_percentage: '0.00',
    sequence: 1,
    notes: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockParentProduct = {
    id: parentProdId,
    organization_id: orgAId,
    sku: 'PARENT-PROD',
    name: 'Parent Product',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '100.0000',
    selling_price: '200.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCompProduct = {
    id: compProdId,
    organization_id: orgAId,
    sku: 'COMP-PROD',
    name: 'Component Product',
    description: null,
    category: null,
    unit_of_measure: 'PCS',
    cost_price: '50.0000',
    selling_price: '100.0000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('should validate allowed state transitions correctly', () => {
    expect(bomStateMachineService.canTransition('draft', 'active')).toBe(true);
    expect(bomStateMachineService.canTransition('draft', 'archived')).toBe(true);
    expect(bomStateMachineService.canTransition('active', 'inactive')).toBe(true);
    expect(bomStateMachineService.canTransition('active', 'archived')).toBe(true);
    expect(bomStateMachineService.canTransition('inactive', 'active')).toBe(true);
    expect(bomStateMachineService.canTransition('inactive', 'archived')).toBe(true);

    expect(bomStateMachineService.canTransition('draft', 'inactive')).toBe(false);
    expect(bomStateMachineService.canTransition('active', 'draft')).toBe(false);
    expect(bomStateMachineService.canTransition('archived', 'active')).toBe(false);
    expect(bomStateMachineService.canTransition('archived', 'draft')).toBe(false);
  });

  it('should throw BomAlreadyInStateError on repeated state transition', async () => {
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom);

    await expect(
      bomStateMachineService.transitionState(orgAId, bomId, 'draft', userAId),
    ).rejects.toThrow(BomAlreadyInStateError);
  });

  it('should throw BomInvalidStateTransitionError on invalid transition', async () => {
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom);

    await expect(
      bomStateMachineService.transitionState(orgAId, bomId, 'inactive', userAId),
    ).rejects.toThrow(BomInvalidStateTransitionError);
  });

  it('should reject activation of an empty BOM with BomEmptyError', async () => {
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValueOnce([]);

    await expect(
      bomStateMachineService.transitionState(orgAId, bomId, 'active', userAId),
    ).rejects.toThrow(BomEmptyError);
  });

  it('should reject activation if effective dates are invalid', async () => {
    const invalidDatesBom: Bom = {
      ...mockBom,
      effective_from: new Date('2026-12-31'),
      effective_to: new Date('2026-01-01'),
    };
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(invalidDatesBom);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValueOnce([mockComponent]);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockParentProduct);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockCompProduct);

    await expect(
      bomStateMachineService.transitionState(orgAId, bomId, 'active', userAId),
    ).rejects.toThrow(BomEffectiveDateError);
  });

  it('should activate valid BOM successfully', async () => {
    vi.spyOn(bomRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockBom);
    vi.spyOn(bomRepository, 'listComponents').mockResolvedValueOnce([mockComponent]);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockParentProduct);
    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockCompProduct);
    vi.spyOn(bomRepository, 'update').mockResolvedValueOnce({
      ...mockBom,
      status: 'active',
    });
    vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue(null as unknown as AuditLog);

    const activated = await bomStateMachineService.transitionState(orgAId, bomId, 'active', userAId);
    expect(activated.status).toBe('active');
  });
});
