# Phase 2 — Domain Design

## Platform: Mechanica
## Methodology: Domain-Driven Design (DDD)
## Document Version: 1.0

---

# 2.1 Domain Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MECHANICA — DOMAIN MAP                              │
│                                                                             │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │                   │   │                   │   │                   │       │
│  │  CUSTOMER         │   │  VEHICLE          │   │  WORK ORDER       │       │
│  │  MANAGEMENT       │──▶│  MANAGEMENT       │──▶│  MANAGEMENT       │       │
│  │                   │   │                   │   │                   │       │
│  │  Core Domain      │   │  Core Domain      │   │  Core Domain      │       │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│         │                       │                       │                    │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │                   │   │                   │   │                   │       │
│  │  LABOR &          │   │  INVENTORY        │   │  PURCHASING       │       │
│  │  SERVICES         │   │  MANAGEMENT       │   │  MANAGEMENT       │       │
│  │                   │   │                   │   │                   │       │
│  │  Supporting       │   │  Supporting       │   │  Supporting       │       │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│         │                       │                       │                    │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │                   │   │                   │   │                   │       │
│  │  INVOICING        │   │  PAYMENTS         │   │  QUALITY          │       │
│  │                   │   │                   │   │  CONTROL          │       │
│  │  Supporting       │   │  Supporting       │   │  Supporting       │       │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│         │                       │                       │                    │
│         │                       │                       │                    │
│         ▼                       ▼                       ▼                    │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │                   │   │                   │   │                   │       │
│  │  NOTIFICATIONS    │   │  DOCUMENTS        │   │  AUDIT LOG        │       │
│  │                   │   │                   │   │                   │       │
│  │  Generic          │   │  Generic          │   │  Generic          │       │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     MULTI-BRANCH (Cross-Cutting)                 │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                     AUTH / IAM (Cross-Cutting)                    │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bounded Context Summary

| # | Bounded Context | Type | Description |
|---|----------------|------|-------------|
| BC1 | Customer Management | Core | Customer profiles, contacts, customer-vehicle relationships |
| BC2 | Vehicle Management | Core | Vehicle profiles, VIN, specifications, vehicle history |
| BC3 | Work Order Management | Core | Work orders, status flow, mechanic assignments, parts/labor tracking |
| BC4 | Labor & Services | Supporting | Service catalog, labor rates, time standards |
| BC5 | Inventory Management | Supporting | Parts catalog, stock levels, warehouses, batch/serial tracking |
| BC6 | Purchasing | Supporting | Suppliers, purchase orders, goods receipt, returns |
| BC7 | Invoicing | Supporting | Invoice generation, taxes, discounts, credit notes |
| BC8 | Payments | Supporting | Payment processing, reconciliation, refunds |
| BC9 | Quality Control | Supporting | Inspection checklists, approvals, delivery blocking |
| BC10 | Notifications | Generic | In-app notifications, email dispatch |
| BC11 | Document Management | Generic | File storage, versioning, search |
| BC12 | Audit Log | Generic | Immutable audit trail, entity change tracking |
| BC13 | Reports | Supporting | Aggregated data, KPIs, analytics |
| BC14 | IAM (Identity & Access) | Generic | Authentication, authorization, RBAC, user management |
| BC15 | Multi-Branch | Cross-Cutting | Branch entity, branch-scoped data, transfers, consolidated reporting |

---

# 2.2 Aggregates

## AGG-01: Customer Aggregate

```
┌──────────────────────────────────────┐
│           CUSTOMER AGGREGATE         │
│          Root: Customer              │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  Customer  │──▶│  ContactInfo  │  │
│  │  (Root)    │   │  (Value Obj)  │  │
│  └────────────┘   └───────────────┘  │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐                      │
│  │  Vehicle   │                      │
│  │  (Entity)  │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Customer
**Entities:** Customer, Vehicle
**Value Objects:** ContactInfo (email, phone, address), CustomerType
**Invariants:**
- Customer must have at least one contact method
- Email must be unique per branch

## AGG-02: Vehicle Aggregate

```
┌──────────────────────────────────────┐
│           VEHICLE AGGREGATE          │
│          Root: Vehicle               │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  Vehicle   │──▶│  VINInfo      │  │
│  │  (Root)    │   │  (Value Obj)  │  │
│  └────────────┘   └───────────────┘  │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐                      │
│  │  Document  │                      │
│  │  (Entity)  │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Vehicle
**Entities:** Vehicle, VehicleDocument
**Value Objects:** VINInfo (decoded VIN attributes), OdometerReading, LicensePlate
**Invariants:**
- VIN must be valid (17 chars, checksum)
- Vehicle must be associated with at least one customer or be a fleet vehicle

## AGG-03: Work Order Aggregate

```
┌──────────────────────────────────────────────┐
│           WORK ORDER AGGREGATE                │
│          Root: WorkOrder                      │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────┐  1:N   ┌───────────────┐     │
│  │ WorkOrder  │───────▶│  LaborEntry   │     │
│  │ (Root)     │        │  (Entity)     │     │
│  └────────────┘        └───────────────┘     │
│        │                ┌───────────────┐     │
│        │ 1:N            │  PartEntry    │     │
│        ├───────────────▶│  (Entity)     │     │
│        │                └───────────────┘     │
│        │                ┌───────────────┐     │
│        │ 1:N            │  TimeEntry    │     │
│        ├───────────────▶│  (Entity)     │     │
│        │                └───────────────┘     │
│        │                ┌───────────────┐     │
│        │ 1:N            │  WorkNote     │     │
│        ├───────────────▶│  (Entity)     │     │
│        │                └───────────────┘     │
│        │                ┌───────────────┐     │
│        │ 1:N            │  Attachment   │     │
│        │                │  (Entity)     │     │
│        ▼                └───────────────┘     │
│  ┌────────────┐                               │
│  │  WOStatus  │                               │
│  │  (Value)   │                               │
│  └────────────┘                               │
│                                              │
└──────────────────────────────────────────────┘
```

**Aggregate Root:** WorkOrder
**Entities:** WorkOrder, LaborEntry, PartEntry, TimeEntry, WorkNote, Attachment
**Value Objects:** WOStatus (OPEN|DIAGNOSED|WAITING_PARTS|IN_PROGRESS|QUALITY_CHECK|COMPLETED|DELIVERED), Money, LaborRate
**Invariants:**
- WorkOrder must have at least one labor entry or one part entry to be COMPLETED
- Status transitions are strict (cannot skip states)
- TimeEntry must not overlap for same mechanic
- Parts cannot exceed available inventory (with override for backorder)

## AGG-04: Inventory Aggregate

```
┌──────────────────────────────────────┐
│          INVENTORY AGGREGATE         │
│          Root: Warehouse             │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐                      │
│  │ Warehouse  │                      │
│  │ (Root)     │                      │
│  └────────────┘                      │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐   ┌───────────────┐  │
│  │ StockItem  │──▶│  BinLocation  │  │
│  │ (Entity)   │   │  (Value Obj)  │  │
│  └────────────┘   └───────────────┘  │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐                      │
│  │ StockBatch │                      │
│  │ (Entity)   │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Warehouse
**Entities:** Warehouse, StockItem, StockBatch, StockMovement
**Value Objects:** BinLocation, Money (unit cost), QuantityOnHand, ReorderLevel
**Invariants:**
- Quantity on hand >= 0 (no negative inventory)
- StockBatch quantities must reconcile with StockItem total
- Serial numbers must be unique

## AGG-05: Purchase Order Aggregate

```
┌──────────────────────────────────────┐
│        PURCHASE ORDER AGGREGATE      │
│          Root: PurchaseOrder         │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  Purchase  │──▶│  Supplier     │  │
│  │  Order     │   │  (Reference)  │  │
│  │  (Root)    │   └───────────────┘  │
│  └────────────┘                      │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐                      │
│  │ POLineItem │                      │
│  │ (Entity)   │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** PurchaseOrder
**Entities:** PurchaseOrder, POLineItem
**Value Objects:** POStatus (DRAFT|SENT|CONFIRMED|SHIPPED|PARTIAL|RECEIVED|CANCELLED), Money
**Invariants:**
- PO total must equal sum of line items
- Cannot receive more than ordered quantity
- Status transitions: DRAFT → SENT → CONFIRMED → SHIPPED → (PARTIAL|RECEIVED) → CANCELLED

## AGG-06: Invoice Aggregate

```
┌──────────────────────────────────────┐
│            INVOICE AGGREGATE         │
│          Root: Invoice               │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  Invoice   │──▶│  InvoiceLine  │  │
│  │  (Root)    │   │  (Entity)     │  │
│  └────────────┘   └───────────────┘  │
│        │          ┌───────────────┐  │
│        │          │  TaxLine      │  │
│        ├─────────▶│  (Entity)     │  │
│        │          └───────────────┘  │
│        │          ┌───────────────┐  │
│        │          │  Payment      │  │
│        ├─────────▶│  (Reference)  │  │
│        │          └───────────────┘  │
│        │                             │
│  ┌────────────┐                      │
│  │  InvStatus │                      │
│  │  (Value)   │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Invoice
**Entities:** Invoice, InvoiceLine, TaxLine
**Value Objects:** InvStatus (DRAFT|ISSUED|PARTIALLY_PAID|PAID|CANCELLED|CREDITED), Money, TaxRate
**Invariants:**
- Invoice total = sum(labor) + sum(parts) + sum(taxes) - discounts
- Cannot add payments to CANCELLED or CREDITED invoices
- Paid amount cannot exceed invoice total + rounding tolerance

## AGG-07: Payment Aggregate

```
┌──────────────────────────────────────┐
│           PAYMENT AGGREGATE          │
│          Root: Payment               │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐                      │
│  │  Payment   │                      │
│  │  (Root)    │                      │
│  └────────────┘                      │
│        │                             │
│        │ 1:N                         │
│        ▼                             │
│  ┌────────────┐                      │
│  │PaymentAlloc│                      │
│  │ (Entity)   │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Payment
**Entities:** Payment, PaymentAllocation
**Value Objects:** PaymentMethod (CASH|CARD|BANK_TRANSFER|CHECK), Money
**Invariants:**
- Sum of allocations must equal payment amount
- A payment must be allocated to at least one invoice

## AGG-08: Quality Control Aggregate

```
┌──────────────────────────────────────┐
│        QUALITY CONTROL AGGREGATE     │
│          Root: ChecklistTemplate     │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │ Checklist  │──▶│ ChecklistItem │  │
│  │ Template   │   │ (Entity)      │  │
│  │ (Root)     │   └───────────────┘  │
│  └────────────┘                      │
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │  QCResult  │──▶│  QCCheck      │  │
│  │  (Entity)  │   │  (Entity)     │  │
│  └────────────┘   └───────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** ChecklistTemplate
**Entities:** ChecklistTemplate, ChecklistItem, QCResult, QCCheck
**Value Objects:** PassFail, DefectSeverity
**Invariants:**
- All checklist items must be completed for a QC pass
- Failed QC requires re-inspection after rework

## AGG-09: Service Aggregate

```
┌──────────────────────────────────────┐
│            SERVICE AGGREGATE         │
│          Root: Service               │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐                      │
│  │  Service   │                      │
│  │  (Root)    │                      │
│  └────────────┘                      │
│                                      │
│  ┌────────────┐                      │
│  │  RateCard  │                      │
│  │  (Entity)  │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** Service
**Entities:** Service, RateCard
**Value Objects:** ServiceCode, Money, TimeDuration
**Invariants:**
- Service code must be unique per branch
- Rate must be positive

## AGG-10: User Aggregate

```
┌──────────────────────────────────────┐
│             USER AGGREGATE           │
│          Root: User                  │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────┐   ┌───────────────┐  │
│  │    User    │──▶│  UserRole     │  │
│  │  (Root)    │   │  (Entity)     │  │
│  └────────────┘   └───────────────┘  │
│        │          ┌───────────────┐  │
│        │          │  BranchAssign │  │
│        ├─────────▶│  (Entity)     │  │
│        │          └───────────────┘  │
│        │          ┌───────────────┐  │
│        │          │  Permission   │  │
│        │          │  (Value Obj)  │  │
│        ▼          └───────────────┘  │
│  ┌────────────┐                      │
│  │  UserPref  │                      │
│  │  (Value)   │                      │
│  └────────────┘                      │
│                                      │
└──────────────────────────────────────┘
```

**Aggregate Root:** User
**Entities:** User, UserRole, BranchAssignment
**Value Objects:** Password, Permission, UserPreferences
**Invariants:**
- User must have at least one role
- Password must meet complexity requirements
- Email must be unique

---

# 2.3 Entities

| Entity | Bounded Context | Description | Key Attributes |
|--------|----------------|-------------|----------------|
| Customer | Customer Mgmt | Person or company owning vehicles | id, name, type, taxId |
| Vehicle | Vehicle Mgmt | Customer vehicle profile | id, vin, make, model, year, licensePlate |
| WorkOrder | Work Order Mgmt | Repair/service job | id, status, customerId, vehicleId, odometer, complaint |
| LaborEntry | Work Order Mgmt | Service line on a work order | id, workOrderId, serviceId, technicianId, hours, rate |
| PartEntry | Work Order Mgmt | Part used on a work order | id, workOrderId, stockItemId, quantity, unitPrice |
| TimeEntry | Work Order Mgmt | Mechanic clock in/out | id, workOrderId, mechanicId, startTime, endTime |
| WorkNote | Work Order Mgmt | Note on work order | id, workOrderId, content, type(internal/customer) |
| Warehouse | Inventory Mgmt | Physical storage location | id, branchId, name, address |
| StockItem | Inventory Mgmt | Part/product in inventory | id, sku, name, category, reorderPoint, reorderQty |
| StockBatch | Inventory Mgmt | Batch of stock items | id, stockItemId, batchNo, expiryDate, quantity |
| StockMovement | Inventory Mgmt | Stock transaction | id, stockItemId, type(in/out/adjust), quantity, reference |
| PurchaseOrder | Purchasing | Order to supplier | id, poNumber, supplierId, status, totalAmount |
| POLineItem | Purchasing | Line on purchase order | id, purchaseOrderId, stockItemId, quantity, unitPrice |
| Supplier | Purchasing | Parts vendor | id, name, contactInfo, paymentTerms, leadTime |
| Service | Labor & Services | Repair service definition | id, code, name, description, defaultRate |
| RateCard | Labor & Services | Pricing by branch/service | id, serviceId, branchId, rate, effectiveDate |
| Invoice | Invoicing | Customer invoice | id, invoiceNumber, workOrderId, status, total, taxTotal |
| InvoiceLine | Invoicing | Line on invoice | id, invoiceId, type(labor/part/misc), description, amount |
| TaxLine | Invoicing | Tax applied to invoice | id, invoiceId, taxName, taxRate, taxAmount |
| Payment | Payments | Customer payment | id, amount, method, reference, paidAt |
| PaymentAllocation | Payments | Payment-to-invoice allocation | id, paymentId, invoiceId, amount |
| CreditNote | Invoicing | Negative invoice/refund | id, invoiceId, reason, total, createdAt |
| ChecklistTemplate | Quality Control | QC checklist definition | id, name, serviceType |
| ChecklistItem | Quality Control | Individual check item | id, checklistTemplateId, description, order |
| QCResult | Quality Control | QC inspection result | id, workOrderId, inspectorId, result(pass/fail), checkedAt |
| QCCheck | Quality Control | Individual check result | id, qcResultId, checklistItemId, passed, notes |
| Branch | Multi-Branch | Workshop branch | id, name, address, phone, settings |
| User | IAM | System user | id, email, password, name, isActive |
| AuditEntry | Audit Log | Immutable change record | id, entityType, entityId, action, oldValues, newValues, userId |
| Notification | Notifications | User notification | id, userId, type, title, body, readAt |
| Document | Document Mgmt | File/resource | id, fileName, mimeType, size, s3Key, entityType, entityId |

---

# 2.4 Value Objects

| Value Object | Bounded Context | Attributes | Notes |
|-------------|----------------|------------|-------|
| ContactInfo | Customer | email, phone, address | Immutable |
| VINInfo | Vehicle | make, model, year, trim, engine, transmission, drivetrain | Decoded from VIN |
| OdometerReading | Vehicle | value, unit(km/mi), date | Immutable |
| LicensePlate | Vehicle | number, state/province, country | |
| Money | Shared | amount, currency | Primitive obsession avoidance |
| LaborRate | Labor | rate, unit(HOURLY|FLAT), currency | |
| TimeDuration | Shared | hours, minutes | |
| WOStatus | Work Order | value (enum) | Strict state machine |
| POStatus | Purchasing | value (enum) | Strict state machine |
| InvStatus | Invoicing | value (enum) | Strict state machine |
| BinLocation | Inventory | warehouse, aisle, rack, shelf, bin | |
| QuantityOnHand | Inventory | quantity, unitOfMeasure | |
| ReorderLevel | Inventory | minStock, maxStock, reorderPoint | |
| Address | Shared | line1, line2, city, state, zip, country | |
| Password | IAM | hashedValue | Never exposes plaintext |
| Permission | IAM | resource, action, scope | |
| UserPreferences | IAM | theme(locale, darkMode, timezone) | |
| TaxRate | Invoicing | name, percentage, isCompound | |
| PaymentMethod | Payments | value (enum) | |
| PassFail | Quality Control | passed(boolean), notes | |
| DefectSeverity | Quality Control | value (CRITICAL|MAJOR|MINOR) | |

---

# 2.5 Domain Events

| Event | Bounded Context | Payload | Trigger |
|-------|----------------|---------|---------|
| CustomerCreated | Customer Mgmt | customerId, name, email | New customer registered |
| VehicleRegistered | Vehicle Mgmt | vehicleId, vin, customerId | Vehicle added to system |
| WorkOrderCreated | Work Order Mgmt | workOrderId, customerId, vehicleId, status | Work order created |
| WorkOrderStatusChanged | Work Order Mgmt | workOrderId, fromStatus, toStatus, changedBy | Status transition |
| MechanicAssigned | Work Order Mgmt | workOrderId, mechanicId, assignmentType(primary/support) | Mechanic assigned |
| TimeEntryStarted | Work Order Mgmt | workOrderId, mechanicId, startTime | Mechanic clocks in |
| TimeEntryCompleted | Work Order Mgmt | workOrderId, mechanicId, endTime, totalHours | Mechanic clocks out |
| PartReserved | Work Order Mgmt | workOrderId, stockItemId, quantity | Part assigned to WO |
| PartConsumed | Inventory Mgmt | workOrderId, stockItemId, quantity, batchNo | Part used from inventory |
| StockLevelLow | Inventory Mgmt | stockItemId, currentQty, reorderPoint | Stock below threshold |
| PurchaseOrderCreated | Purchasing | purchaseOrderId, supplierId, totalAmount | PO created |
| PurchaseOrderReceived | Purchasing | purchaseOrderId, receivedBy, items | Goods received |
| InvoiceIssued | Invoicing | invoiceId, workOrderId, total, customerId | Invoice finalized |
| PaymentReceived | Payments | paymentId, invoiceId, amount, method | Payment recorded |
| InvoicePaid | Invoicing | invoiceId, paidAmount, totalPaid | Invoice fully paid |
| QCCompleted | Quality Control | workOrderId, inspectorId, result(pass/fail) | QC check done |
| DeliveryBlocked | Quality Control | workOrderId, reason | QC/invoice block |
| WorkOrderCompleted | Work Order Mgmt | workOrderId, completedAt | WO marked COMPLETED |
| WorkOrderDelivered | Work Order Mgmt | workOrderId, deliveredAt | Vehicle delivered |
| UserLoggedIn | IAM | userId, timestamp, ipAddress | User authentication |
| BranchTransferInitiated | Inventory Mgmt | transferId, fromBranch, toBranch, items | Stock transfer |
| AuditEntryCreated | Audit Log | auditEntryId, entityType, entityId, action | Any entity change |

## Domain Event Flow Diagram

```
┌──────────┐    WorkOrderCreated     ┌──────────┐
│ WorkOrder │────────────────────────▶│  Invoice │
│  Mgmt    │    WorkOrderCompleted   │  Mgmt    │
│          │────────────────────────▶│          │
└──────────┘                         └──────────┘
     │                                     │
     │ PartConsumed                   PaymentReceived
     ▼                                     ▼
┌──────────┐                         ┌──────────┐
│Inventory │                         │ Payments │
│  Mgmt   │                         │  Mgmt   │
└──────────┘                         └──────────┘
     │
     │ StockLevelLow
     ▼
┌──────────┐    POReceived          ┌──────────┐
│Purchasing│◀───────────────────────│Inventory │
│  Mgmt   │                        │  Mgmt   │
└──────────┘                        └──────────┘
     │
     │ QCCompleted
     ▼
┌──────────┐    DeliveryBlocked     ┌──────────┐
│ Quality  │───────────────────────▶│ WorkOrder│
│ Control  │                        │  Mgmt   │
└──────────┘                        └──────────┘
```

---

# 2.6 Domain Services

| Service | Bounded Context | Responsibility |
|---------|----------------|----------------|
| VINDecoderService | Vehicle Mgmt | Decode VIN to vehicle specs via NHTSA API |
| PricingService | Invoicing | Calculate line item prices based on rate cards |
| TaxCalculatorService | Invoicing | Apply tax rules by jurisdiction |
| DiscountEngine | Invoicing | Apply discount policies |
| InventoryValuationService | Inventory Mgmt | Calculate inventory value (FIFO/Weighted Avg) |
| ReorderService | Inventory Mgmt | Evaluate reorder points and suggest POs |
| StatusMachine | Work Order Mgmt | Enforce valid status transitions |
| TimeTrackerService | Work Order Mgmt | Calculate billable vs non-billable time |
| QualityGateService | Quality Control | Determine if delivery should be blocked |
| ReportAggregator | Reports | Aggregate data across branches |
| NotificationDispatcher | Notifications | Route notifications to channels |
| AuditTrailService | Audit Log | Create immutable audit entries with hash chain |

---

# 2.7 Repository Contracts

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REPOSITORY INTERFACES                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ICustomerRepository                                                │
│    findByEmail(email: Email): Promise<Customer | null>              │
│    findByBranch(branchId: BranchId): Promise<Customer[]>            │
│    findWithVehicles(customerId: CustomerId): Promise<Customer>      │
│    save(customer: Customer): Promise<Customer>                      │
│    softDelete(customerId: CustomerId): Promise<void>                │
│                                                                     │
│  IVehicleRepository                                                 │
│    findByVin(vin: VIN): Promise<Vehicle | null>                     │
│    findByCustomer(customerId: CustomerId): Promise<Vehicle[]>       │
│    findByLicensePlate(plate: string): Promise<Vehicle | null>       │
│    findWithHistory(vehicleId: VehicleId): Promise<Vehicle>          │
│    save(vehicle: Vehicle): Promise<Vehicle>                         │
│    softDelete(vehicleId: VehicleId): Promise<void>                  │
│                                                                     │
│  IWorkOrderRepository                                               │
│    findById(id: WorkOrderId): Promise<WorkOrder>                   │
│    findByStatus(status: WOStatus): Promise<WorkOrder[]>             │
│    findByVehicle(vehicleId: VehicleId): Promise<WorkOrder[]>        │
│    findByMechanic(mechanicId: UserId, dateRange: DateRange)          │
│    findWithDetails(id: WorkOrderId): Promise<WorkOrder>            │
│    findKanbanBoard(branchId: BranchId): Promise<WorkOrderGrouped>   │
│    save(workOrder: WorkOrder): Promise<WorkOrder>                   │
│    updateStatus(id: WorkOrderId, status: WOStatus): Promise<void>  │
│    softDelete(id: WorkOrderId): Promise<void>                       │
│                                                                     │
│  IStockItemRepository                                               │
│    findBySku(sku: string): Promise<StockItem | null>                │
│    findByBranch(branchId: BranchId): Promise<StockItem[]>           │
│    findLowStock(branchId: BranchId): Promise<StockItem[]>           │
│    findByCategory(category: string): Promise<StockItem[]>           │
│    save(stockItem: StockItem): Promise<StockItem>                   │
│    softDelete(id: StockItemId): Promise<void>                       │
│                                                                     │
│  IPurchaseOrderRepository                                           │
│    findById(id: PurchaseOrderId): Promise<PurchaseOrder>           │
│    findBySupplier(supplierId: SupplierId): Promise<PurchaseOrder[]> │
│    findByStatus(status: POStatus): Promise<PurchaseOrder[]>         │
│    findPendingDelivery(): Promise<PurchaseOrder[]>                  │
│    save(po: PurchaseOrder): Promise<PurchaseOrder>                  │
│                                                                     │
│  IInvoiceRepository                                                 │
│    findById(id: InvoiceId): Promise<Invoice>                       │
│    findByWorkOrder(workOrderId: WorkOrderId): Promise<Invoice>      │
│    findByStatus(status: InvStatus): Promise<Invoice[]>              │
│    findOverdue(thresholdDate: Date): Promise<Invoice[]>             │
│    findByDateRange(start: Date, end: Date): Promise<Invoice[]>      │
│    save(invoice: Invoice): Promise<Invoice>                         │
│                                                                     │
│  IPaymentRepository                                                 │
│    findById(id: PaymentId): Promise<Payment>                       │
│    findByInvoice(invoiceId: InvoiceId): Promise<Payment[]>          │
│    findByDateRange(start: Date, end: Date): Promise<Payment[]>      │
│    save(payment: Payment): Promise<Payment>                         │
│                                                                     │
│  IQCResultRepository                                                │
│    findByWorkOrder(workOrderId: WorkOrderId): Promise<QCResult[]>   │
│    findLatestByWorkOrder(workOrderId: WorkOrderId): Promise<QCResult>│
│    save(qcResult: QCResult): Promise<QCResult>                      │
│                                                                     │
│  IUserRepository                                                    │
│    findByEmail(email: string): Promise<User | null>                 │
│    findByIdWithRoles(userId: UserId): Promise<User>                 │
│    findByBranch(branchId: BranchId): Promise<User[]>                │
│    findByRole(role: UserRole): Promise<User[]>                      │
│    save(user: User): Promise<User>                                  │
│    updatePassword(userId: UserId, password: Password): Promise<void>│
│    softDelete(userId: UserId): Promise<void>                        │
│                                                                     │
│  IAuditEntryRepository                                              │
│    findByEntity(entityType: string, entityId: string): Promise<AuditEntry[]>│
│    findByUser(userId: UserId, dateRange: DateRange): Promise<AuditEntry[]>  │
│    findByDateRange(start: Date, end: Date): Promise<AuditEntry[]>   │
│    save(auditEntry: AuditEntry): Promise<AuditEntry>                │
│    findTamperedEntries(): Promise<AuditEntry[]>                     │
│                                                                     │
│  IBranchRepository                                                  │
│    findById(id: BranchId): Promise<Branch>                         │
│    findAll(): Promise<Branch[]>                                      │
│    save(branch: Branch): Promise<Branch>                             │
│    softDelete(id: BranchId): Promise<void>                          │
│                                                                     │
│  INotificationRepository                                            │
│    findByUser(userId: UserId): Promise<Notification[]>              │
│    findUnreadByUser(userId: UserId): Promise<Notification[]>        │
│    save(notification: Notification): Promise<Notification>          │
│    markAsRead(notificationId: NotificationId): Promise<void>         │
│    markAllAsRead(userId: UserId): Promise<void>                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 2.8 Context Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT MAP                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ACL   ┌──────────────┐   ┌──────────────┐           │
│  │  Vehicle     │───────▶│  Work Order  │──▶│   Invoicing  │           │
│  │  Management  │        │  Management  │   │              │           │
│  └──────────────┘        └──────────────┘   └──────────────┘           │
│                                │  OHS                                  │
│                                ▼                                       │
│                        ┌──────────────┐   ┌──────────────┐             │
│                        │  Inventory   │──▶│  Purchasing  │             │
│                        │  Management  │   │              │             │
│                        └──────────────┘   └──────────────┘             │
│                                │                                       │
│                                ▼                                       │
│                        ┌──────────────┐                                │
│                        │  Quality     │                                │
│                        │  Control     │                                │
│                        └──────────────┘                                │
│                                                                         │
│  Customer Management ──▶ Work Order Management (Customer/Vehicle ref)  │
│  Payments ────▶ Invoicing (PaymentAllocation)                          │
│  IAM ────▶ All Contexts (Authentication + Authorization)               │
│  Multi-Branch ────▶ All Contexts (Branch scoping)                      │
│  Audit Log ────▶ All Contexts (Event subscription)                     │
│  Notifications ────▶ All Contexts (Event subscription)                 │
│  Documents ────▶ Work Order, Vehicle, Customer (Attachment refs)       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Legend for Context Map:**
- ACL = Anti-Corruption Layer
- OHS = Open-Host Service
- Shared Kernel = Shared entities across contexts
- Conformist = Downstream conforms to upstream

---

*End of Phase 2 — Domain Design*
