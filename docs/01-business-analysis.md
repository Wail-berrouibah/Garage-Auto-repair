# Phase 1 — Business Analysis

## Platform: Mechanica
## Document Version: 1.0
## Classification: Internal — Architecture Blueprint

---

# 1.1 Business Goals

| # | Goal | Description | KPI | Priority |
|---|------|-------------|-----|----------|
| G1 | Digitize workshop operations | Replace paper-based workflows with digital work orders, checklists, and record keeping | 100% digital workflow adoption | Critical |
| G2 | Increase shop efficiency | Reduce vehicle turnaround time through optimized scheduling, parts management, and mechanic assignment | 20% reduction in average repair time | Critical |
| G3 | Improve inventory accuracy | Real-time parts tracking with automated reorder points, batch/serial tracking, and supplier management | 99% inventory accuracy | High |
| G4 | Enhance financial control | End-to-end invoicing, payment tracking, credit notes, and financial reporting | < 2% billing error rate | Critical |
| G5 | Multi-branch scalability | Unified platform supporting single shops to 50+ branch chains with consolidated reporting | Support 50+ branches on single instance | High |
| G6 | Regulatory compliance | Immutable audit logs, data retention, tax compliance, and role-based access controls | 100% audit trail coverage | Critical |
| G7 | Mechanic productivity tracking | Measure job completion times, utilization rates, and skill-based assignment optimization | 15% increase in billable hours | Medium |
| G8 | Customer satisfaction | Faster repairs, accurate estimates, transparent status updates, and quality control checkpoints | 90%+ satisfaction score | High |

---

# 1.2 User Personas

## Persona 1: Marco — Shop Owner (Multi-Branch)

```
Demographics:
  - Age: 45
  - Role: Owner/Operator of 3 repair shops
  - Tech Proficiency: Medium
  - Devices: Desktop (office), iPad (on-site), iPhone (mobile)

Pain Points:
  - Cannot see real-time performance across branches
  - Paperwork errors causing revenue loss
  - Mechanics padding hours
  - No consolidated financial reporting
  - Parts disappearing from inventory

Goals:
  - Real-time dashboard across all branches
  - Automated invoicing with tax compliance
  - Mechanic time tracking and productivity reports
  - Inventory alerts and purchase order automation
  - Role-based access for managers

Success Metrics:
  - 99% inventory accuracy
  - 20% reduction in average repair time
  - Real-time P&L by branch
```

## Persona 2: Sarah — Service Manager (Single Branch)

```
Demographics:
  - Age: 34
  - Role: Service Manager at mid-size shop (8 mechanics)
  - Tech Proficiency: High
  - Devices: Desktop, Tablet

Pain Points:
  - Manually assigning work to mechanics
  - Chasing parts status across suppliers
  - Coordinating quality checks
  - Missed follow-ups with customers

Goals:
  - Kanban-style work order board
  - Drag-and-drop mechanic assignment
  - Parts procurement workflow with supplier tracking
  - QC checklist automation
  - Customer status notifications

Success Metrics:
  - < 1 hour average from completion to delivery
  - Zero missed QC steps
  - 100% parts traceability
```

## Persona 3: Carlos — Master Mechanic

```
Demographics:
  - Age: 29
  - Role: Senior Technician (ASE Certified)
  - Tech Proficiency: Medium
  - Devices: Shop tablet, smartphone

Pain Points:
  - Paper work orders get lost or damaged
  - Hard to document findings with photos
  - Waiting for parts with no visibility
  - Handwriting illegible on forms

Goals:
  - Digital work order with photo/document upload
  - Parts availability lookup
  - Clock-in/out on jobs
  - Service manual access
  - Digital inspection checklists

Success Metrics:
  - 3+ jobs completed per day
  - < 5 minutes per job admin time
```

## Persona 4: Lisa — Receptionist

```
Demographics:
  - Age: 26
  - Role: Front Desk / Customer Intake
  - Tech Proficiency: High
  - Devices: Desktop, Tablet

Pain Points:
  - Manual vehicle check-in process
  - Communicating status to waiting customers
  - Paper forms for customer info
  - No digital vehicle history lookup

Goals:
  - Quick vehicle check-in with VIN scan
  - Customer profile with vehicle history
  - Digital waiver/signature capture
  - Real-time status updates for customers
  - Appointment scheduling

Success Metrics:
  - < 5 minutes check-in time
  - 100% digital forms capture
```

## Persona 5: Priya — Accountant

```
Demographics:
  - Age: 38
  - Role: Staff Accountant (handles 2 shops)
  - Tech Proficiency: High
  - Devices: Desktop, Excel, accounting software

Pain Points:
  - Reconciling invoices with payments manually
  - Tax reporting is time-consuming
  - Tracking unpaid invoices
  - No integration with QuickBooks/Xero

Goals:
  - Automated invoice generation
  - Payment reconciliation dashboard
  - Tax reports by jurisdiction
  - Export to accounting software
  - Credit note and refund workflow

Success Metrics:
  - Same-day invoice closing
  - < 1% reconciliation errors
```

## Persona 6: David — Inventory Manager

```
Demographics:
  - Age: 41
  - Role: Parts / Inventory Manager (multi-branch)
  - Tech Proficiency: Medium
  - Devices: Desktop, handheld scanner

Pain Points:
  - Manual stock counts
  - Overstock and stockouts
  - No batch/lot tracking
  - Supplier performance not tracked

Goals:
  - Real-time stock levels across branches
  - Automated reorder point alerts
  - Batch/serial number tracking
  - Supplier scorecards
  - Transfer orders between branches

Success Metrics:
  - 99.5% inventory accuracy
  - 15% reduction in stock holding costs
```

---

# 1.3 User Roles

| Role | Code | Description | Typical Count (per branch) |
|------|------|-------------|----------------------------|
| Owner | `OWNER` | Full system access, cross-branch admin, financial visibility | 1 |
| Manager | `MANAGER` | Branch-level operations, work order management, team oversight | 1-2 |
| Receptionist | `RECEPTIONIST` | Vehicle check-in, customer intake, appointment scheduling | 1-2 |
| Mechanic | `MECHANIC` | Work order execution, time tracking, parts requests | 3-15 |
| Accountant | `ACCOUNTANT` | Invoicing, payments, financial reports, tax compliance | 1 |
| Inventory Manager | `INVENTORY_MANAGER` | Stock management, purchasing, supplier relations, transfers | 1-2 |

---

# 1.4 Business Workflows

## Workflow 1: Vehicle Check-In to Delivery

```
[Customer Arrives]
       |
       v
[Receptionist: Register/Find Vehicle]
       |
       v
[Receptionist: Capture Customer Concerns]
       |
       v
[Manager/Mechanic: Initial Diagnosis]
       |
       v
[Manager: Create Work Order]
       |
       v
[Manager: Assign Mechanic(s)]
       |
       v
[Mechanic: Perform Diagnosis] --> [Needs Parts?] --> [Create Parts Request]
       |                                              |
       v                                              v
[Status: DIAGNOSED]                           [Status: WAITING_PARTS]
       |                                              |
       v                                              v
[Mechanic: Begin Repair]                [Parts Arrive → Resume Repair]
       |
       v
[Status: IN_PROGRESS]
       |
       v
[Mechanic: Complete Repair]
       |
       v
[QC: Quality Inspection]
       |
       v
[Status: QUALITY_CHECK --> COMPLETED]
       |
       v
[Manager: Finalize Invoice]
       |
       v
[Customer: Payment]
       |
       v
[Status: DELIVERED]
```

## Workflow 2: Parts Procurement

```
[Stock Level < Reorder Point] OR [Work Order Parts Request]
       |
       v
[Inventory Manager: Create Purchase Order]
       |
       v
[Inventory Manager: Select Supplier]
       |
       v
[Status: PO_SENT]
       |
       v
[Supplier: Acknowledges]
       |
       v
[Status: PO_CONFIRMED]
       |
       v
[Supplier: Ships Parts]
       |
       v
[Status: PO_SHIPPED]
       |
       v
[Receive Parts → Inventory Manager: Match with PO]
       |
       v
[Status: PO_RECEIVED (Partial/Full)]
       |
       v
[Update Inventory Stock]
       |
       v
[Link to Work Order if applicable]
```

## Workflow 3: Invoice to Payment

```
[Work Order Completed]
       |
       v
[System: Auto-Calculate Labor (from time tracking)]
       |
       v
[System: Auto-Calculate Parts (from usage)]
       |
       v
[System: Apply Taxes & Discounts]
       |
       v
[Manager: Review & Finalize Invoice]
       |
       v
[Invoice Status: ISSUED]
       |
       v
[Customer: Payment]
       |
       v
[Payment Method: Cash/Card/Bank Transfer/Partial]
       |
       v
[Invoice Status: PAID (or PARTIALLY_PAID)]
       |
       v
[System: Update Financial Reports]
```

## Workflow 4: Multi-Branch Inventory Transfer

```
[Branch A: Needs Part from Branch B]
       |
       v
[Inventory Manager: Create Transfer Order]
       |
       v
[Branch B: Approves Transfer]
       |
       v
[Branch B: Pick & Ship Part]
       |
       v
[Branch A: Receive Part]
       |
       v
[System: Update Both Branch Inventories]
       |
       v
[System: Log Transfer in Audit Trail]
```

---

# 1.5 Functional Requirements

## FR1 — Authentication & Authorization

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1.1 | Email/password login with MFA support | Critical |
| FR1.2 | JWT-based session management with refresh tokens | Critical |
| FR1.3 | Role-based access control (RBAC) for all actions | Critical |
| FR1.4 | Password policy enforcement (min 12 chars, complexity) | Critical |
| FR1.5 | Session timeout and force logout | High |
| FR1.6 | Branch-scoped data access | Critical |

## FR2 — Vehicle Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR2.1 | Vehicle profile with VIN, make, model, year, trim, engine, transmission | Critical |
| FR2.2 | VIN decoding (NHTSA or third-party API) | High |
| FR2.3 | Vehicle photo upload (exterior, interior, damage pre-check) | Medium |
| FR2.4 | Vehicle history timeline (all work orders, inspections) | Critical |
| FR2.5 | Customer-to-vehicle association (1:N) | Critical |
| FR2.6 | License plate lookup | Medium |

## FR3 — Work Order Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR3.1 | Create work order with customer concerns, vehicle info, odometer | Critical |
| FR3.2 | Status flow: OPEN → DIAGNOSED → WAITING_PARTS → IN_PROGRESS → QUALITY_CHECK → COMPLETED → DELIVERED | Critical |
| FR3.3 | Mechanic assignment (primary + support) | Critical |
| FR3.4 | Labor line items with service codes, time estimates | Critical |
| FR3.5 | Parts line items with inventory linking | Critical |
| FR3.6 | Time tracking (clock in/out on jobs) | Critical |
| FR3.7 | Photo/document attachment per work order | High |
| FR3.8 | Internal notes (not visible on invoice) | Medium |
| FR3.9 | Customer-visible notes | Medium |
| FR3.10 | Status change history with timestamps | Critical |

## FR4 — Inventory Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR4.1 | Parts master catalog with categories, brands, part numbers | Critical |
| FR4.2 | Warehouse/Bin location tracking | Critical |
| FR4.3 | Stock-in/Stock-out transactions | Critical |
| FR4.4 | Batch/lot number tracking | High |
| FR4.5 | Serial number tracking for high-value parts | High |
| FR4.6 | Reorder point and reorder quantity settings | Critical |
| FR4.7 | Inventory valuation (FIFO/Weighted Average) | High |
| FR4.8 | Stock count / physical inventory adjustment | High |
| FR4.9 | Low stock alerts | Critical |
| FR4.10 | Transfer between branches | High |

## FR5 — Purchasing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR5.1 | Supplier master with contact info, payment terms, lead times | Critical |
| FR5.2 | Purchase order creation from reorder points or manual | Critical |
| FR5.3 | PO status tracking: DRAFT → SENT → CONFIRMED → SHIPPED → PARTIAL → RECEIVED → CANCELLED | Critical |
| FR5.4 | Goods receipt matching against PO | Critical |
| FR5.5 | Returns to supplier workflow | Medium |
| FR5.6 | Supplier performance metrics (on-time delivery, defect rate) | Medium |

## FR6 — Labor & Services Catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| FR6.1 | Service catalog with code, name, description, default rate | Critical |
| FR6.2 | Labor rate configuration (flat rate, hourly) | Critical |
| FR6.3 | Time standards (book time vs actual time) | High |
| FR6.4 | Service categorization (repair, maintenance, inspection, body) | Medium |

## FR7 — Invoicing

| ID | Requirement | Priority |
|----|-------------|----------|
| FR7.1 | Auto-generate invoice from work order completion | Critical |
| FR7.2 | Line items: labor, parts, miscellaneous, taxes | Critical |
| FR7.3 | Tax calculation (configurable rates, multiple tax brackets) | Critical |
| FR7.4 | Discounts (percentage, fixed, per-line, global) | High |
| FR7.5 | Credit notes / negative invoices | High |
| FR7.6 | Invoice numbering with prefix per branch | Critical |
| FR7.7 | Invoice statuses: DRAFT → ISSUED → PARTIALLY_PAID → PAID → CANCELLED → CREDITED | Critical |
| FR7.8 | Invoice PDF generation | High |
| FR7.9 | Invoice history per vehicle/customer | Medium |

## FR8 — Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| FR8.1 | Receive payments against invoices | Critical |
| FR8.2 | Payment methods: Cash, Credit Card, Debit Card, Bank Transfer, Check | Critical |
| FR8.3 | Partial payment support | Critical |
| FR8.4 | Payment receipt generation | High |
| FR8.5 | Refund processing | High |
| FR8.6 | Payment reconciliation | Medium |

## FR9 — Quality Control

| ID | Requirement | Priority |
|----|-------------|----------|
| FR9.1 | Inspection checklist templates per service type | High |
| FR9.2 | QC sign-off by authorized personnel | Critical |
| FR9.3 | QC failure → return to IN_PROGRESS workflow | Critical |
| FR9.4 | Delivery blocking rules (e.g., unpaid invoice, QC pending) | High |
| FR9.5 | Photo evidence for QC checks | Medium |

## FR10 — Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| FR10.1 | Financial reports: P&L, revenue by branch, revenue by mechanic | Critical |
| FR10.2 | Workshop reports: jobs completed, avg time, status distribution | Critical |
| FR10.3 | Mechanic reports: utilization, billable hours, job count | Critical |
| FR10.4 | Inventory reports: stock valuation, slow movers, turnover | High |
| FR10.5 | Export to CSV/Excel/PDF | High |
| FR10.6 | Report scheduling and email delivery | Medium |

## FR11 — Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR11.1 | In-app notification center | Critical |
| FR11.2 | Email notification architecture (pluggable provider) | High |
| FR11.3 | Notifications for: status changes, parts arrival, QC approval, payment received | High |
| FR11.4 | Notification preferences per user | Medium |

## FR12 — Audit Logs

| ID | Requirement | Priority |
|----|-------------|----------|
| FR12.1 | Immutable audit log for all entity changes | Critical |
| FR12.2 | Capture: who, what, when, previous value, new value | Critical |
| FR12.3 | Audit log retention policy (configurable) | Critical |
| FR12.4 | Audit log search and export | High |
| FR12.5 | Tamper detection (hash chain) | High |

## FR13 — Multi-Branch

| ID | Requirement | Priority |
|----|-------------|----------|
| FR13.1 | Branch entity with address, contact, settings | Critical |
| FR13.2 | User-branch assignment | Critical |
| FR13.3 | Data isolation by branch | Critical |
| FR13.4 | Cross-branch inventory transfers | High |
| FR13.5 | Consolidated reporting across branches | Critical |
| FR13.6 | Branch-level settings (tax rates, invoice prefix, currency) | High |

## FR14 — Document Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR14.1 | File upload with type validation | Medium |
| FR14.2 | Document categorization (invoice, inspection, photo, manual) | Medium |
| FR14.3 | Document versioning | Low |
| FR14.4 | Full-text search on document metadata | Medium |
| FR14.5 | S3-compatible storage integration | Critical |

## FR15 — Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| FR15.1 | KPI cards: active WOs, pending parts, revenue today, utilization | Critical |
| FR15.2 | Charts: revenue trend, WO status distribution, mechanic workload | Critical |
| FR15.3 | Activity feed: recent status changes, new WOs, payments received | High |
| FR15.4 | Quick actions: new WO, check-in vehicle, receive parts | High |
| FR15.5 | Branch selector for multi-branch view | Critical |

---

# 1.6 Non-Functional Requirements

| ID | Requirement | Target | Priority |
|----|-------------|--------|----------|
| NFR1 | Availability | 99.9% uptime (8.76 hrs/year max downtime) | Critical |
| NFR2 | Response Time (API) | P95 < 500ms, P99 < 2s | Critical |
| NFR3 | Response Time (Dashboard) | P95 < 2s page load | High |
| NFR4 | Concurrent Users (per branch) | Support 50 concurrent users | High |
| NFR5 | Concurrent Users (platform) | Support 2000 concurrent users | Critical |
| NFR6 | Max Branches | 50+ branches on single instance | High |
| NFR7 | Data Retention | Audit logs: 7 years; Financial: 10 years; Operational: 3 years | Critical |
| NFR8 | Backup RPO | < 15 minutes data loss | Critical |
| NFR9 | Backup RTO | < 1 hour recovery time | Critical |
| NFR10 | Security | OWASP Top 10 compliance | Critical |
| NFR11 | Accessibility | WCAG 2.1 AA | Medium |
| NFR12 | Browser Support | Last 2 major versions of Chrome, Firefox, Safari, Edge | High |
| NFR13 | Mobile Support | Responsive design, mobile-friendly forms | High |
| NFR14 | Localization | English primary, i18n architecture for future | Medium |
| NFR15 | Audit Completeness | 100% of CRUD operations logged | Critical |
| NFR16 | Horizontally Scalable | Stateless app servers, scale via container orchestration | Critical |
| NFR17 | API Contract Stability | Versioned APIs (v1, v2...), backward compatible within major version | High |

---

# 1.7 System Boundaries

## In Scope

- Vehicle lifecycle management
- Work order lifecycle (check-in → delivery)
- Mechanic management and time tracking
- Inventory and warehouse management
- Purchasing and supplier management
- Labor service catalog and pricing
- Invoicing, credit notes, payment processing
- Quality control checklists and approvals
- Financial, workshop, mechanic, inventory reporting
- Role-based access control with branch scoping
- Immutable audit logging
- Multi-branch operations
- Document storage and management
- In-app and email notifications
- Dashboard with KPIs and charts

## Out of Scope (v1.0)

- Customer portal / self-service
- Mobile native apps (responsive web only)
- Online booking/scheduling (manual appointment only)
- Payroll processing
- Accounting software sync (export only)
- SMS notifications (architecture ready, no provider integration)
- Credit card payment gateway integration (architecture ready, mock in v1)
- Third-party parts catalog API integration (VIN decoding exception)
- AI/ML-based diagnostics
- Telematics/ECU data reading
- CRM beyond vehicle/customer profiles
- Marketing automation
- Time clock / biometric hardware integration

## Integration Boundaries (v1.0)

| Integration | Type | Direction | Status |
|-------------|------|-----------|--------|
| VIN Decoding (NHTSA) | REST API | Outbound | v1.0 |
| S3-Compatible Storage | SDK | Outbound | v1.0 |
| SMTP Email | Protocol | Outbound | v1.0 |
| Payment Terminal (mock) | Internal | — | v1.0 |
| QuickBooks/Xero | REST API | Outbound | v2.0 |
| Parts Catalog API | REST API | Outbound | v2.0 |
| SMS Gateway | REST API | Outbound | v2.0 |

---

*End of Phase 1 — Business Analysis*
