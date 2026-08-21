import { e2eOrgA } from './organizations';
import { e2eCustomerA } from './customers';
import { e2eSupplierA } from './suppliers';
import { e2eProductA } from './products';

export { e2eOrgA, e2eCustomerA, e2eSupplierA, e2eProductA };

export const e2eSalesOrderPayload = {
  organization_id: e2eOrgA.id,
  customer_id: e2eCustomerA.id,
  order_number: 'SO-E2E-1001',
  items: [
    {
      product_id: e2eProductA.id,
      quantity: '5.0000',
      unit_price: '150.0000',
    },
  ],
};
