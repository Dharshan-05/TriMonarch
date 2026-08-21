import { describe, it, expect } from 'vitest';
import { InvalidStateTransitionError } from '../../../src/types';

describe('Phase 061 — ERP Workflow State Machine Unit Tests', () => {
  describe('Sales Order State Machine', () => {
    const ALLOWED_SALES_ORDER_TRANSITIONS: Record<string, string[]> = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed'],
      completed: [],
      cancelled: [],
    };

    const validateSalesOrderTransition = (current: string, next: string): boolean => {
      const allowed = ALLOWED_SALES_ORDER_TRANSITIONS[current];
      if (!allowed || !allowed.includes(next)) {
        throw new InvalidStateTransitionError(`Cannot transition Sales Order from '${current}' to '${next}'`);
      }
      return true;
    };

    it('should allow valid Sales Order state transitions', () => {
      expect(validateSalesOrderTransition('draft', 'confirmed')).toBe(true);
      expect(validateSalesOrderTransition('confirmed', 'processing')).toBe(true);
      expect(validateSalesOrderTransition('processing', 'shipped')).toBe(true);
      expect(validateSalesOrderTransition('shipped', 'completed')).toBe(true);
    });

    it('should reject invalid Sales Order state transitions', () => {
      expect(() => validateSalesOrderTransition('draft', 'completed')).toThrow(InvalidStateTransitionError);
      expect(() => validateSalesOrderTransition('completed', 'draft')).toThrow(InvalidStateTransitionError);
    });
  });

  describe('Purchase Order State Machine', () => {
    const ALLOWED_PURCHASE_ORDER_TRANSITIONS: Record<string, string[]> = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'cancelled'],
      approved: ['processing', 'cancelled'],
      processing: ['partially_received', 'received', 'cancelled'],
      partially_received: ['received', 'completed'],
      received: ['completed'],
      completed: [],
      cancelled: [],
    };

    const validatePurchaseOrderTransition = (current: string, next: string): boolean => {
      const allowed = ALLOWED_PURCHASE_ORDER_TRANSITIONS[current];
      if (!allowed || !allowed.includes(next)) {
        throw new InvalidStateTransitionError(`Cannot transition Purchase Order from '${current}' to '${next}'`);
      }
      return true;
    };

    it('should allow valid Purchase Order state transitions', () => {
      expect(validatePurchaseOrderTransition('draft', 'submitted')).toBe(true);
      expect(validatePurchaseOrderTransition('submitted', 'approved')).toBe(true);
      expect(validatePurchaseOrderTransition('approved', 'processing')).toBe(true);
      expect(validatePurchaseOrderTransition('processing', 'received')).toBe(true);
    });

    it('should reject invalid Purchase Order state transitions', () => {
      expect(() => validatePurchaseOrderTransition('draft', 'completed')).toThrow(InvalidStateTransitionError);
    });
  });

  describe('Manufacturing Order State Machine', () => {
    const ALLOWED_MANUFACTURING_ORDER_TRANSITIONS: Record<string, string[]> = {
      draft: ['planned', 'cancelled'],
      planned: ['released', 'cancelled'],
      released: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    const validateManufacturingOrderTransition = (current: string, next: string): boolean => {
      const allowed = ALLOWED_MANUFACTURING_ORDER_TRANSITIONS[current];
      if (!allowed || !allowed.includes(next)) {
        throw new InvalidStateTransitionError(`Cannot transition Manufacturing Order from '${current}' to '${next}'`);
      }
      return true;
    };

    it('should allow valid Manufacturing Order state transitions', () => {
      expect(validateManufacturingOrderTransition('draft', 'planned')).toBe(true);
      expect(validateManufacturingOrderTransition('planned', 'released')).toBe(true);
      expect(validateManufacturingOrderTransition('released', 'in_progress')).toBe(true);
      expect(validateManufacturingOrderTransition('in_progress', 'completed')).toBe(true);
    });

    it('should reject invalid Manufacturing Order state transitions', () => {
      expect(() => validateManufacturingOrderTransition('completed', 'in_progress')).toThrow(InvalidStateTransitionError);
    });
  });
});
