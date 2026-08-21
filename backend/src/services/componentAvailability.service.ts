import { PoolClient } from 'pg';
import { ManufacturingOrder } from '../types/database';
import {
  componentAvailabilityEngine,
  ManufacturingOrderAvailabilityResult,
} from './componentAvailability.engine';

export class ComponentAvailabilityService {
  async checkManufacturingOrderAvailability(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
    moInput?: ManufacturingOrder,
  ): Promise<ManufacturingOrderAvailabilityResult> {
    return componentAvailabilityEngine.calculateAvailability(
      organizationId,
      manufacturingOrderId,
      client,
      moInput,
    );
  }

  async checkComponentAvailability(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
    moInput?: ManufacturingOrder,
  ): Promise<ManufacturingOrderAvailabilityResult> {
    return this.checkManufacturingOrderAvailability(organizationId, manufacturingOrderId, client, moInput);
  }

  async getReadiness(
    organizationId: string,
    manufacturingOrderId: string,
    client?: PoolClient,
  ) {
    const availability = await this.checkManufacturingOrderAvailability(
      organizationId,
      manufacturingOrderId,
      client,
    );
    return {
      ready_for_execution: availability.ready,
      component_availability: availability,
    };
  }
}

export const componentAvailabilityService = new ComponentAvailabilityService();
