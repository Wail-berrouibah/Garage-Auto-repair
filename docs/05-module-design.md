# Phase 5 — Module Design

## Platform: Mechanica
## Document Version: 1.0

---

# 5.1 Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MECHANICA MODULE MAP                                │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    CORE DOMAIN MODULES                           │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │       │
│  │  │ Vehicle      │  │ Work Order   │  │ Customer             │   │       │
│  │  │ Management   │  │ Management   │  │ Management           │   │       │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘   │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                  SUPPORTING DOMAIN MODULES                        │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │       │
│  │  │ Inventory    │  │ Purchasing   │  │ Labor &      │           │       │
│  │  │ Management   │  │              │  │ Services     │           │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │       │
│  │  │ Invoicing    │  │ Payments     │  │ Quality      │           │       │
│  │  │              │  │              │  │ Control      │           │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │       │
│  │  ┌──────────────┐  ┌──────────────┐                             │       │
│  │  │ Dashboard    │  │ Reports      │                             │       │
│  │  └──────────────┘  └──────────────┘                             │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                   GENERIC / INFRASTRUCTURE MODULES                │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │       │
│  │  │ Notifications│  │ Documents    │  │ Audit Log    │           │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                    CROSS-CUTTING MODULES                          │       │
│  ├──────────────────────────────────────────────────────────────────┤       │
│  │  ┌──────────────┐  ┌──────────────────────────────────────────┐  │       │
│  │  │ IAM          │  │ Multi-Branch                             │  │       │
│  │  └──────────────┘  └──────────────────────────────────────────┘  │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 5.2 Dashboard Module

## Purpose
Provide real-time operational visibility through KPIs, charts, activity feed, and quick actions.

## Features

### KPI Cards
| KPI | Source | Refresh | Description |
|-----|--------|---------|-------------|
| Active Work Orders | work_orders WHERE status NOT IN (COMPLETED, DELIVERED) | Real-time | Currently open WOs |
| Waiting Parts | work_orders WHERE status = WAITING_PARTS | Real-time | WOs blocked on parts |
| Revenue Today | invoices WHERE created_at = TODAY AND status = PAID | Real-time | Today's collected revenue |
| Mechanic Utilization | time_entries WHERE clock_in TODAY | 5 min | % of mechanics clocked in |
| Avg Repair Time | work_orders WHERE completed_at TODAY | 5 min | Average hours to complete |
| QC Pass Rate | qc_inspection_results WHERE TODAY | 5 min | % passing first inspection |

### Charts
- Revenue trend (7/30/90 days — bar/line)
- Work order status distribution (donut)
- Mechanic workload (horizontal bar)
- Parts consumption top 10 (bar)
- Branch comparison (multi-series, multi-branch)

### Activity Feed
- Recent status changes on work orders
- New work orders created
- Payments received
- Parts received (purchase orders)
- QC results
- Scrollable, grouped by date

### Quick Actions
- New Work Order
- Check-In Vehicle
- Receive Parts
- New Purchase Order
- Quick Invoice

## API Endpoints

```
GET    /api/v1/dashboard/kpi                    → Dashboard KPIs
GET    /api/v1/dashboard/kpi?branchId={id}       → Branch-specific KPIs
GET    /api/v1/dashboard/charts/revenue          → Revenue chart data
GET    /api/v1/dashboard/charts/wo-status        → Work order status distribution
GET    /api/v1/dashboard/charts/mechanic-load    → Mechanic workload
GET    /api/v1/dashboard/activity                → Activity feed (paginated)
```

---

# 5.3 Vehicle Management Module

## Purpose
Manage vehicle profiles, histories, and attachments across their lifecycle.

## Features

### Vehicle Profile
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| VIN | String(17) | Yes | Validated, decoded via NHTSA API |
| License Plate | String(20) | No | |
| License State | String(50) | No | |
| Make | String(100) | Auto | From VIN decode |
| Model | String(100) | Auto | From VIN decode |
| Year | SmallInt | Auto | From VIN decode |
| Trim | String(100) | Auto | From VIN decode |
| Engine | String(100) | Auto | From VIN decode |
| Transmission | String(50) | Auto | From VIN decode |
| Drivetrain | String(50) | Auto | From VIN decode |
| Fuel Type | String(50) | Auto | From VIN decode |
| Color | String(50) | No | |
| Odometer | Integer | Per-visit | Updated on check-in |
| Photo | Image | No | Vehicle photo |

### Vehicle History
- Timeline view of all work orders (date, status, summary, total)
- Inspection history
- Odometer readings over time
- Linked documents

### VIN Decoding
- On create, decode VIN via NHTSA API (`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{vin}`)
- Populate make, model, year, trim, engine, transmission, drivetrain, body class
- Allow manual override if decoding fails

## API Endpoints

```
GET    /api/v1/vehicles                      → List vehicles (paginated, filterable)
GET    /api/v1/vehicles/:id                  → Vehicle detail with history
POST   /api/v1/vehicles                      → Create vehicle
PUT    /api/v1/vehicles/:id                  → Update vehicle
DELETE /api/v1/vehicles/:id                  → Soft delete vehicle
GET    /api/v1/vehicles/by-vin/:vin          → Lookup by VIN
GET    /api/v1/vehicles/:id/history          → Vehicle work order timeline
GET    /api/v1/vehicles/:id/documents        → Vehicle documents
POST   /api/v1/vehicles/decode-vin           → Decode VIN (returns decoded data)
```

---

# 5.4 Work Order Management Module

## Purpose
Core business module — manages the entire repair workflow from check-in to delivery.

## Status State Machine

```
                    ┌──────────────────────────────┐
                    │            OPEN               │
                    └─────────────┬────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │         DIAGNOSED             │
                    └─────────────┬────────────────┘
                                 / \
                                /   \
                               ▼     ▼
                 ┌────────────────┐  ┌────────────────┐
                 │  WAITING_PARTS  │  │  IN_PROGRESS   │
                 └────────┬───────┘  └────────┬───────┘
                          │                   │
                          └─────────┬─────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────┐
                    │       QUALITY_CHECK           │
                    └─────────────┬────────────────┘
                           ┌──────┴──────┐
                           │             │
                          PASS          FAIL ──→ IN_PROGRESS
                           │
                           ▼
                    ┌──────────────────────────────┐
                    │         COMPLETED             │
                    └─────────────┬────────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────────┐
                    │         DELIVERED             │
                    └──────────────────────────────┘
```

### Status Transitions

| From | To | Requires | Side Effects |
|------|-----|----------|--------------|
| OPEN | DIAGNOSED | Diagnosis notes | Update timestamp |
| DIAGNOSED | WAITING_PARTS | Parts request created | Notification to inventory manager |
| DIAGNOSED | IN_PROGRESS | Mechanic assigned | Clock-in starts |
| WAITING_PARTS | IN_PROGRESS | Parts received | Link parts to WO |
| IN_PROGRESS | QUALITY_CHECK | All labor entries completed | Create QC inspection |
| QUALITY_CHECK | COMPLETED | QC passed | Calculate totals, ready for invoicing |
| QUALITY_CHECK | IN_PROGRESS | QC failed | Re-open for rework |
| COMPLETED | DELIVERED | Invoice paid OR payment arrangement | Update delivered_at |
| ANY | CANCELLED | Reason required | Release reserved parts |

### Work Order Board (Kanban)

Columns representing each status. Drag-and-drop moves cards between columns (calls status update API).

**Card displays:**
- WO Number
- Customer name
- Vehicle (make/model/license)
- Priority indicator (color)
- Assigned mechanic avatar
- Time in current status
- Parts waiting indicator

### Task Management
- Primary mechanic + support mechanics (1:N)
- Labor entries with service code, estimated vs actual hours
- Part entries with inventory link
- Time tracking with clock-in/clock-out per mechanic

## API Endpoints

```
GET    /api/v1/work-orders                    → List WOs (paginated, filterable)
GET    /api/v1/work-orders/kanban             → Grouped by status for board view
GET    /api/v1/work-orders/:id                → WO detail with all relations
POST   /api/v1/work-orders                    → Create WO (from check-in)
PUT    /api/v1/work-orders/:id                → Update WO
DELETE /api/v1/work-orders/:id                → Soft delete WO
PATCH  /api/v1/work-orders/:id/status         → Change status
POST   /api/v1/work-orders/:id/assign         → Assign mechanic
POST   /api/v1/work-orders/:id/labor          → Add labor entry
PUT    /api/v1/work-orders/:id/labor/:labId   → Update labor entry
DELETE /api/v1/work-orders/:id/labor/:labId   → Remove labor entry
POST   /api/v1/work-orders/:id/parts          → Add part entry
PUT    /api/v1/work-orders/:id/parts/:partId  → Update part entry
DELETE /api/v1/work-orders/:id/parts/:partId  → Remove part entry
POST   /api/v1/work-orders/:id/time           → Clock in/out
GET    /api/v1/work-orders/:id/time           → Time entries for WO
POST   /api/v1/work-orders/:id/notes          → Add note
GET    /api/v1/work-orders/:id/notes          → Get notes
POST   /api/v1/work-orders/:id/attachments    → Upload attachment
GET    /api/v1/work-orders/:id/attachments    → List attachments
GET    /api/v1/work-orders/:id/history        → Status change history
```

---

# 5.5 Mechanics Module

## Purpose
Manage mechanic profiles, skills, attendance, assignments, and productivity.

## Features

### Mechanic Profile (User extension)
- User profile with role = MECHANIC
- Skills/Certifications (ASE, manufacturer certs)
- Specialties (engine, transmission, electrical, body, AC, etc.)
- Hourly labor rate (individual, overrides service default)
- Employment status (ACTIVE, ON_LEAVE, TERMINATED)

### Attendance & Time
- Clock-in/clock-out per work order
- Total hours tracked
- Break time tracking (future)
- Attendance calendar view

### Assignments
- Primary mechanic per work order
- Support mechanics
- Automated workload balancing (future)

### Productivity Metrics
| Metric | Formula | Source |
|--------|---------|--------|
| Utilization Rate | Billable hours / Available hours | time_entries |
| Job Completion Rate | Jobs completed / Jobs assigned | work_orders |
| Avg Job Time | Total hours / Jobs completed | time_entries |
| Revenue Generated | Sum of labor revenue | labor_entries |
| QC Pass Rate | Jobs passed QC / Jobs inspected | qc_results |

## API Endpoints

```
GET    /api/v1/mechanics                     → List mechanics
GET    /api/v1/mechanics/:id                 → Mechanic detail with metrics
PUT    /api/v1/mechanics/:id                 → Update mechanic profile
GET    /api/v1/mechanics/:id/schedule        → Current/upcoming assignments
GET    /api/v1/mechanics/:id/productivity    → Productivity metrics (date range)
GET    /api/v1/mechanics/:id/time-entries    → Time entries (date range)
GET    /api/v1/mechanics/available           → Available mechanics now
```

---

# 5.6 Inventory Management Module

## Purpose
Manage parts inventory across warehouses, including stock tracking, batch/serial, and valuation.

## Features

### Warehouse Management
- Multiple warehouses per branch
- Bin locations (aisle → rack → shelf → bin)
- Warehouse transfers

### Stock Items
- SKU, part number, barcode
- Category, brand
- Unit of measure
- Quantity on hand / reserved / available
- Cost and selling price
- Reorder point and quantity
- Batch and/or serial tracking flags

### Stock Movements
| Type | Description | Effect |
|------|-------------|--------|
| RECEIVING | Stock received from supplier | +Qty |
| SALE | Part consumed on work order | -Qty |
| ADJUSTMENT | Physical count adjustment | +/-Qty |
| TRANSFER_OUT | Sent to another branch | -Qty |
| TRANSFER_IN | Received from another branch | +Qty |
| RETURN_TO_SUPPLIER | Return to vendor | -Qty |
| RETURN_FROM_CUSTOMER | Customer return | +Qty |

### Inventory Valuation
- Method: Weighted Average Cost
- Unit cost updated on each receipt: `(existing_value + receipt_value) / (existing_qty + receipt_qty)`
- Valuation report: quantity × unit cost per item

### Reorder Alerts
- Background job runs periodically
- Checks all stock items: `(qty_on_hand - qty_reserved) <= reorder_point`
- Creates purchase order suggestions
- Sends in-app notification

## API Endpoints

```
GET    /api/v1/inventory/items               → List stock items (paginated, filterable)
GET    /api/v1/inventory/items/:id           → Stock item detail
POST   /api/v1/inventory/items               → Create stock item
PUT    /api/v1/inventory/items/:id           → Update stock item
DELETE /api/v1/inventory/items/:id           → Soft delete item
GET    /api/v1/inventory/items/:id/batches   → Batches for item
POST   /api/v1/inventory/items/:id/adjust    → Adjust quantity
GET    /api/v1/inventory/warehouses          → List warehouses
POST   /api/v1/inventory/warehouses          → Create warehouse
GET    /api/v1/inventory/movements           → List movements (filterable)
GET    /api/v1/inventory/low-stock           → Low stock alerts
GET    /api/v1/inventory/valuation           → Inventory valuation report
```

---

# 5.7 Purchasing Module

## Purpose
Manage supplier relationships, purchase orders, goods receiving, and returns.

## Features

### Supplier Management
- Supplier profile with contact info
- Payment terms, lead time
- Supplier scorecard (on-time %, defect rate, pricing)
- Parts linked to preferred suppliers

### Purchase Order Flow
```
DRAFT ──→ SENT ──→ CONFIRMED ──→ SHIPPED ──→ RECEIVED
   │                                               │
   └─────────── CANCELLED ←────────────────────────┘
                         PARTIAL ←── (if partial receive)
```

### Goods Receipt
- Match against PO line items
- Partial receipts supported
- Auto-updates inventory stock
- Creates stock movements

### Returns
- Return to supplier workflow
- RMA number tracking
- Credit/refund from supplier

## API Endpoints

```
GET    /api/v1/purchasing/suppliers          → List suppliers
POST   /api/v1/purchasing/suppliers          → Create supplier
PUT    /api/v1/purchasing/suppliers/:id      → Update supplier
GET    /api/v1/purchasing/purchase-orders    → List POs
POST   /api/v1/purchasing/purchase-orders    → Create PO
PUT    /api/v1/purchasing/purchase-orders/:id → Update PO
PATCH  /api/v1/purchasing/purchase-orders/:id/status → Update PO status
GET    /api/v1/purchasing/purchase-orders/:id → PO detail
POST   /api/v1/purchasing/purchase-orders/:id/receive → Receive goods
POST   /api/v1/purchasing/purchase-orders/:id/return → Return goods
```

---

# 5.8 Labor & Services Module

## Purpose
Define the service catalog, labor rates, and time standards.

## Features

### Service Catalog
- Hierarchical categories
- Service code (unique per branch)
- Name, description, category
- Default rate and rate unit (HOURLY or FLAT)
- Estimated time (book time)
- Status (active/inactive)

### Rate Cards
- Branch-specific pricing
- Effective date range
- Can be customer-type specific (future)

### Time Standards
- Book time vs actual time tracking
- Variance reporting
- Flag services where actual consistently exceeds book time

## API Endpoints

```
GET    /api/v1/services                      → List services
POST   /api/v1/services                      → Create service
PUT    /api/v1/services/:id                  → Update service
DELETE /api/v1/services/:id                  → Soft delete service
GET    /api/v1/services/:id/rate-cards       → Rate cards for service
POST   /api/v1/services/:id/rate-cards       → Add rate card
```

---

# 5.9 Invoicing Module

## Purpose
Generate invoices from completed work orders, manage taxes, discounts, and credit notes.

## Features

### Invoice Generation
- Auto-generated from completed work order
- Labor lines from labor_entries
- Parts lines from part_entries
- Tax calculation (configurable)
- Discounts (percentage or fixed, per line or global)
- Custom line items (miscellaneous)

### Tax Engine
| Feature | Description |
|---------|-------------|
| Multiple tax rates | Support up to 5 concurrent tax rates |
| Compound tax | Tax-on-tax calculation (e.g., Canada QST on GST) |
| Tax exemptions | Per-customer tax exemption |
| Branch-specific rates | Different taxes per branch |
| Inclusive/Exclusive | Tax-inclusive or tax-exclusive pricing |

### Invoice Status Flow
```
DRAFT ──→ ISSUED ──→ PARTIALLY_PAID ──→ PAID
   │                     │
   └──→ CANCELLED        └──→ CREDITED
```

### Credit Notes
- Full or partial credit against invoice
- Reason required
- Auto-updates invoice status
- Can be applied to future invoices (future)

## API Endpoints

```
GET    /api/v1/invoices                      → List invoices (paginated, filterable)
GET    /api/v1/invoices/:id                  → Invoice detail
POST   /api/v1/invoices                      → Create invoice (manual)
PUT    /api/v1/invoices/:id                  → Update invoice
PATCH  /api/v1/invoices/:id/status           → Update invoice status
POST   /api/v1/invoices/from-wo/:woId        → Generate from work order
GET    /api/v1/invoices/:id/pdf              → Download PDF
POST   /api/v1/invoices/:id/credit-note      → Create credit note
GET    /api/v1/invoices/:id/credit-notes     → List credit notes
```

---

# 5.10 Payments Module

## Purpose
Record and reconcile customer payments against invoices.

## Features

### Payment Methods
| Method | Description | Processing |
|--------|-------------|------------|
| CASH | Physical cash | Manual entry |
| CARD | Credit/Debit card | Terminal integration (future) |
| BANK_TRANSFER | Wire/ACH | Manual entry with reference |
| CHECK | Paper check | Manual entry with check number |

### Payment Flow
1. Receive payment (amount, method, reference)
2. Allocate to one or more invoices (payment_allocations)
3. Update invoice.amount_paid
4. Update invoice.status (PARTIALLY_PAID or PAID)
5. Create payment receipt

### Partial Payments
- Split a payment across multiple invoices
- Multiple payments against single invoice
- Running balance tracking

### Refunds
- Full or partial refund
- Creates negative payment
- Updates invoice status

## API Endpoints

```
GET    /api/v1/payments                      → List payments
GET    /api/v1/payments/:id                  → Payment detail
POST   /api/v1/payments                      → Record payment
POST   /api/v1/payments/:id/refund           → Process refund
GET    /api/v1/payments/invoice/:invId       → Payments for invoice
```

---

# 5.11 Quality Control Module

## Purpose
Ensure repair quality through standardized inspection checklists and approval workflows.

## Features

### Checklist Templates
- Named templates (e.g., "Standard Brake Job QC", "Engine Repair QC")
- Linked to service types/categories
- Ordered list of check items
- Each item: description, required flag

### QC Inspection
1. Triggered when WO enters QUALITY_CHECK status
2. Select matching checklist template
3. Inspector checks each item: PASS/FAIL + notes
4. Photo evidence per check
5. Overall result: PASS or FAIL
6. If FAIL → WO returns to IN_PROGRESS
7. If PASS → WO moves to COMPLETED

### Delivery Blocking
- Business rules that block delivery:
  - QC not completed or failed
  - Invoice not paid
  - Credit hold on customer
- Blocking status visible on work order card
- Overridable by MANAGER/OWNER with reason

## API Endpoints

```
GET    /api/v1/qc/templates                  → List templates
POST   /api/v1/qc/templates                  → Create template
PUT    /api/v1/qc/templates/:id              → Update template
POST   /api/v1/qc/templates/:id/items        → Add checklist item
DELETE /api/v1/qc/templates/:id/items/:itemId → Remove item
GET    /api/v1/qc/inspections                → List inspections
GET    /api/v1/qc/inspections/:id            → Inspection detail
POST   /api/v1/qc/inspections                → Create inspection
PUT    /api/v1/qc/inspections/:id/check/:checkId → Update check result
PATCH  /api/v1/qc/inspections/:id/complete   → Complete inspection
GET    /api/v1/qc/blocked                    → Blocked deliveries
PATCH  /api/v1/qc/blocked/:woId/override     → Override block
```

---

# 5.12 Reports Module

## Purpose
Generate operational and financial reports with export capabilities.

## Reports Catalog

### Financial Reports
| Report | Description | Period |
|--------|-------------|--------|
| Profit & Loss | Revenue vs cost by branch | Daily, Monthly, Yearly |
| Revenue by Branch | Revenue per branch comparison | Daily, Weekly, Monthly |
| Revenue by Service Type | Revenue by service category | Monthly |
| Tax Summary | Tax collected by rate | Monthly, Quarterly |
| Accounts Receivable | Aging of unpaid invoices | Real-time |
| Payment Method Summary | Revenue by payment method | Monthly |

### Workshop Reports
| Report | Description | Period |
|--------|-------------|--------|
| Jobs Completed | Count and value of completed WOs | Daily, Weekly, Monthly |
| Avg Repair Time | Average hours per WO | Weekly, Monthly |
| WO Status Distribution | Count per status | Real-time |
| Parts Usage | Top parts consumed | Monthly |

### Mechanic Reports
| Report | Description | Period |
|--------|-------------|--------|
| Utilization | Billable vs non-billable time | Weekly, Monthly |
| Productivity | Jobs completed, revenue generated | Weekly, Monthly |
| Time Analysis | Actual vs estimated time | Monthly |

### Inventory Reports
| Report | Description | Period |
|--------|-------------|--------|
| Stock Valuation | Total inventory value | Real-time |
| Slow Movers | Items with zero turnover in 90 days | Monthly |
| Stock Accuracy | Variance between system and physical | Per count |
| Reorder Suggestions | Items below reorder point | Real-time |

## API Endpoints

```
GET    /api/v1/reports/financial/pnl                    → P&L report
GET    /api/v1/reports/financial/revenue                 → Revenue report
GET    /api/v1/reports/financial/tax                     → Tax summary
GET    /api/v1/reports/financial/ar                      → AR aging
GET    /api/v1/reports/workshop/jobs                     → Jobs report
GET    /api/v1/reports/workshop/avg-time                 → Avg repair time
GET    /api/v1/reports/workshop/status-distribution       → Status distribution
GET    /api/v1/reports/mechanics/productivity             → Mechanic productivity
GET    /api/v1/reports/mechanics/utilization              → Mechanic utilization
GET    /api/v1/reports/inventory/valuation               → Stock valuation
GET    /api/v1/reports/inventory/slow-movers             → Slow movers
GET    /api/v1/reports/inventory/reorder                 → Reorder suggestions
```

---

# 5.13 Notifications Module

## Purpose
Deliver real-time in-app notifications and provide architecture for email dispatch.

## Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| WO_STATUS_CHANGE | Work order status transitions | Manager, assigned mechanic |
| PARTS_ARRIVED | PO received for a reserved part | Mechanic waiting on parts |
| PARTS_LOW | Stock item below reorder point | Inventory manager |
| QC_RESULT | QC completed (pass/fail) | Manager, mechanic |
| PAYMENT_RECEIVED | Payment recorded | Accountant |
| INVOICE_ISSUED | Invoice generated | Accountant, manager |
| MECHANIC_ASSIGNED | Mechanic assigned to WO | Assigned mechanic |
| TRANSFER_RECEIVED | Transfer order received | Inventory manager |

## API Endpoints

```
GET    /api/v1/notifications                 → User's notifications (paginated)
GET    /api/v1/notifications/unread-count    → Unread count
PATCH  /api/v1/notifications/:id/read        → Mark as read
PATCH  /api/v1/notifications/read-all        → Mark all as read
```

---

# 5.14 Documents Module

## Purpose
Store, version, and manage files across the platform.

## Features

### Document Management
- Upload to S3-compatible storage
- MIME type validation
- File size limits (default 25MB, configurable per type)
- Document categories
- Entity association (work order, vehicle, customer)
- Soft delete
- SHA-256 checksum for integrity

### Versioning
- Track document versions
- All previous versions retained
- Each version stored as separate S3 object

## API Endpoints

```
POST   /api/v1/documents/upload              → Upload file (multipart)
GET    /api/v1/documents/:id                 → Download file (redirect to signed S3 URL)
DELETE /api/v1/documents/:id                 → Soft delete
GET    /api/v1/documents/:id/versions        → List versions
GET    /api/v1/documents/entity/:type/:id    → Documents for entity
```

---

# 5.15 Audit Log Module

## Purpose
Maintain an immutable, tamper-evident audit trail of all entity changes.

## Features

### Audit Entries
| Field | Description |
|-------|-------------|
| action | CREATE, UPDATE, DELETE, APPROVE, LOGIN, LOGOUT |
| entity_type | Entity name (e.g., work_order, invoice) |
| entity_id | UUID of changed entity |
| entity_label | Human-readable reference (e.g., "WO-2024-00042") |
| old_values | JSON snapshot before change |
| new_values | JSON snapshot after change |
| changes | Array of {field, from, to} |
| user_id | Who made the change |
| ip_address | Request origin |
| checksum | Hash chain for integrity |

### Checksum Chain (Tamper Detection)
```
checksum = SHA256(previous_checksum + action + entity_type + entity_id + new_values + created_at)
```

### Retention
- Configurable retention period (default: 7 years)
- Monthly partition pruning (after retention period)
- Archive to S3 before deletion

## API Endpoints

```
GET    /api/v1/audit                         → List audit entries (paginated, filterable)
GET    /api/v1/audit/entity/:type/:id        → Changes for specific entity
GET    /api/v1/audit/user/:userId            → Changes by specific user
GET    /api/v1/audit/verify                  → Verify checksum chain integrity
```

---

# 5.16 Multi-Branch Module

## Purpose
Enable multi-branch operations with data isolation and consolidated reporting.

## Features

### Branch Management
| Field | Description |
|-------|-------------|
| Code | Short code (e.g., NYC01, LAX03) |
| Name | Full branch name |
| Address | Full address |
| Contact | Phone, email |
| Tax ID | Business tax ID |
| Currency | ISO 4217 currency code |
| Timezone | IANA timezone |
| Settings | JSONB for branch-specific config |

### Data Isolation
- All entities scoped by `branch_id`
- Users assigned to branches via `user_branch_assignments`
- RBAC enforced per branch
- Data queries automatically filtered by branch context

### Transfers
- Stock transfer between branches
- Transfer order workflow (DRAFT → PENDING → IN_TRANSIT → RECEIVED)
- Both branches' inventory updated on completion

### Consolidated Reporting
- Branch filter on all reports
- Cross-branch comparison
- Consolidated P&L

## API Endpoints

```
GET    /api/v1/branches                      → List branches
POST   /api/v1/branches                      → Create branch
PUT    /api/v1/branches/:id                  → Update branch
GET    /api/v1/branches/:id                  → Branch detail
GET    /api/v1/transfers                     → List transfer orders
POST   /api/v1/transfers                     → Create transfer
PATCH  /api/v1/transfers/:id/status          → Update transfer status
GET    /api/v1/transfers/:id                 → Transfer detail
```

---

*End of Phase 5 — Module Design*
