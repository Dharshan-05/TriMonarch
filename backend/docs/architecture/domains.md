# TriMonarch ERP — Domain Architecture

## Domain Map

Each ERP domain is a self-contained module with its own controller, service, repository, schema, policy, and routes.

---

## 1. Organization Domain

| Artifact | File |
|----------|------|
| Controller | `src/controllers/organization.controller.ts` |
| Service | `src/services/organization.service.ts` |
| Repository | `src/repositories/organization.repository.ts` |
| Schema | `src/schemas/organization.schema.ts` |
| Policy | `src/policies/organization.policy.ts` |
| Routes | `src/routes/organization.routes.ts` |
| DB Tables | `organizations` |

**Purpose**: Manage tenant root entities. Organization creation bootstraps the tenant context.

---

## 2. Users Domain

| Artifact | File |
|----------|------|
| Controller | `src/controllers/user.controller.ts` |
| Service | `src/services/user.service.ts` |
| Repository | `src/repositories/user.repository.ts` |
| Schema | `src/schemas/user.schema.ts` |
| Policy | `src/policies/user.policy.ts` |
| Routes | `src/routes/user.routes.ts` |
| DB Tables | `users`, `roles`, `user_roles` |

**Purpose**: User lifecycle management, password management, role assignment.

---

## 3. Roles Domain

| Artifact | File |
|----------|------|
| Controller | `src/controllers/role.controller.ts` |
| Service | `src/services/role.service.ts` |
| Repository | `src/repositories/role.repository.ts` |
| Schema | `src/schemas/role.schema.ts` |
| Routes | `src/routes/role.routes.ts` |
| DB Tables | `roles`, `user_roles` |

---

## 4. HR Domain (Departments & Employees)

| Artifact | File |
|----------|------|
| Controllers | `department.controller.ts`, `employee.controller.ts` |
| Services | `department.service.ts`, `employee.service.ts` |
| Repositories | `department.repository.ts`, `employee.repository.ts` |
| Schemas | `department.schema.ts`, `employee.schema.ts` |
| Policy | `employee.policy.ts` |
| DB Tables | `departments`, `employees` |

---

## 5. Partners Domain (Customers & Suppliers)

| Artifact | File |
|----------|------|
| Controllers | `customer.controller.ts`, `supplier.controller.ts`, `partner.controller.ts` |
| Services | `customer.service.ts`, `supplier.service.ts`, `partner.service.ts` |
| Repositories | `customer.repository.ts`, `supplier.repository.ts` |
| Schemas | `customer.schema.ts`, `supplier.schema.ts`, `partner.schema.ts` |
| Policy | `partner.policy.ts` |
| DB Tables | `customers`, `suppliers` |

---

## 6. Products Domain

| Artifact | File |
|----------|------|
| Controller | `product.controller.ts` |
| Service | `product.service.ts` |
| Repository | `product.repository.ts` |
| Schema | `product.schema.ts` |
| Policy | `product.policy.ts` |
| Routes | `product.routes.ts` |
| DB Tables | `products` |

---

## 7. Inventory Domain

| Artifact | File |
|----------|------|
| Controller | `inventory.controller.ts` |
| Service | `inventory.service.ts` |
| Adjustment Service | `stockAdjustment.service.ts` |
| Reservation Service | `stockReservation.service.ts` |
| Repositories | `inventory.repository.ts`, `stockLedger.repository.ts`, `stockReservation.repository.ts` |
| Schema | `inventory.schema.ts`, `stockAdjustment.schema.ts`, `stockReservation.schema.ts` |
| Policy | `inventory.policy.ts` |
| DB Tables | `inventory`, `stock_ledger`, `stock_reservations` |

**Key**: Inventory uses `SELECT FOR UPDATE` row-locking to prevent negative stock under concurrent writes.

---

## 8. Sales Domain

| Artifact | File |
|----------|------|
| Controllers | `salesOrder.controller.ts`, `salesDelivery.controller.ts` |
| Services | `salesOrder.service.ts`, `salesOrderStateMachine.service.ts`, `salesDelivery.service.ts`, `salesDeliveryStateMachine.service.ts` |
| Repositories | `salesOrder.repository.ts`, `salesDelivery.repository.ts` |
| Schemas | `salesOrder.schema.ts`, `salesDelivery.schema.ts` |
| Policy | `salesOrder.policy.ts` |
| DB Tables | `sales_orders`, `sales_order_items`, `sales_deliveries`, `sales_delivery_items` |

**State Machine**: `draft → confirmed → processing → shipped → completed | cancelled`

---

## 9. Procurement Domain

| Artifact | File |
|----------|------|
| Controllers | `purchaseOrder.controller.ts`, `purchaseReceipt.controller.ts`, `supplierInvoice.controller.ts`, `supplierPayment.controller.ts`, `accountsPayable.controller.ts` |
| Services | `purchaseOrder.service.ts`, `purchaseOrderStateMachine.service.ts`, `purchaseReceipt.service.ts`, `purchaseReceiptStateMachine.service.ts`, `supplierInvoice.service.ts`, `supplierInvoiceStateMachine.service.ts`, `supplierPayment.service.ts`, `accountsPayable.service.ts` |
| Policy | `purchaseOrder.policy.ts` |
| DB Tables | `purchase_orders`, `purchase_order_items`, `purchase_receipts`, `purchase_receipt_items`, `supplier_invoices`, `supplier_invoice_items`, `supplier_payments` |

---

## 10. BOM Domain

| Artifact | File |
|----------|------|
| Controllers | `bom.controller.ts`, `bomExplosion.controller.ts`, `componentAvailability.controller.ts` |
| Services | `bom.service.ts`, `bomStateMachine.service.ts`, `bomExplosion.engine.ts`, `bomExplosion.service.ts`, `componentAvailability.engine.ts`, `componentAvailability.service.ts` |
| Repository | `bom.repository.ts` |
| Policy | `bom.policy.ts` |
| DB Tables | `boms`, `bom_items` |

---

## 11. Manufacturing Domain

| Artifact | File |
|----------|------|
| Controllers | `manufacturingOrder.controller.ts`, `manufacturingMaterialConsumption.controller.ts`, `manufacturingProduction.controller.ts`, `manufacturingRollback.controller.ts` |
| Services | `manufacturingOrder.service.ts`, `manufacturingOrderStateMachine.service.ts`, `manufacturingMaterialConsumption.service.ts`, `manufacturingProduction.service.ts`, `manufacturingRollback.service.ts` |
| Repositories | `manufacturing.repository.ts`, `manufacturingMaterialConsumption.repository.ts`, `manufacturingProduction.repository.ts`, `manufacturingRollback.repository.ts` |
| Policy | `manufacturingOrder.policy.ts` |
| DB Tables | `manufacturing_orders`, `manufacturing_order_items`, `manufacturing_order_status_history`, `manufacturing_material_consumptions`, `manufacturing_productions`, `manufacturing_reversals` |

---

## 12. Audit Domain

| Artifact | File |
|----------|------|
| Controller | `audit.controller.ts` |
| Services | `audit.service.ts` (in `src/audit/`) |
| Repository | `audit.repository.ts`, `auditLog.repository.ts` |
| Policy | `audit.policy.ts` |
| Schema | `audit.schema.ts` |
| DB Tables | `audit_logs` |

**Key**: Audit logs are append-only. Database triggers prevent any UPDATE or DELETE.

---

## 13. Business Events Domain

| Artifact | File |
|----------|------|
| Service | `src/services/businessEvent.service.ts` (in `src/events/`) |
| Registry | `businessEvent.registry.ts` |
| Types | `businessEvent.types.ts` |

**Key**: Business events are written within domain transactions to guarantee atomicity.

---

## 14. Authentication Domain

| Artifact | File |
|----------|------|
| Controller | `auth.controller.ts` |
| Service | `auth.service.ts` |
| Token Revocation | `tokenRevocation.service.ts` |
| Password Service | `password.service.ts` |
| DB Tables | `auth_token_revocations` |
