# Phase 4 — Database Design

## Platform: Mechanica
## Database: PostgreSQL 15
## ORM: Prisma 5+
## Document Version: 1.0

---

# 4.1 Entity Relationship Diagram (Textual)

```
┌─────────────┐      ┌──────────────────┐      ┌───────────────────┐
│   Branch     │1──N▶│      User        │1──N▶│   UserRole        │
└──────┬───────┘      └──────────────────┘      └───────────────────┘
       │
       │1:N            ┌──────────────────┐
       ├──────────────▶│   Customer       │
       │               └────────┬─────────┘
       │                       │1:N
       │                       ▼
       │               ┌──────────────────┐      ┌───────────────────┐
       ├──────────────▶│    Vehicle       │1──N▶│  VehicleDocument  │
       │               └────────┬─────────┘      └───────────────────┘
       │                       │1:N
       │                       ▼
       │               ┌──────────────────┐      ┌───────────────────┐
       │               │   WorkOrder      │1──N▶│   LaborEntry      │
       │               │                  │1──N▶│   PartEntry       │
       │               │                  │1──N▶│   TimeEntry       │
       │               │                  │1──N▶│   WorkNote        │
       │               │                  │1──N▶│   WOAttachment    │
       │               │                  │1──N▶│   WOStatusHistory │
       │               └────────┬─────────┘      └───────────────────┘
       │                       │1:N
       │                       ▼
       │               ┌──────────────────┐      ┌───────────────────┐
       │               │     Invoice      │1──N▶│   InvoiceLine     │
       │               │                  │1──N▶│   TaxLine         │
       │               │                  │1──N▶│   CreditNote      │
       │               └────────┬─────────┘      └───────────────────┘
       │                       │1:N
       │                       ▼
       │               ┌──────────────────┐      ┌───────────────────┐
       │               │     Payment      │1──N▶│ PaymentAllocation │
       │               └──────────────────┘      └───────────────────┘
       │
       │               ┌──────────────────┐      ┌───────────────────┐
       ├──────────────▶│    Warehouse     │1──N▶│   StockItem       │
       │               └──────────────────┘      └────────┬──────────┘
       │                                                  │1:N
       │                                                  ▼
       │                                          ┌───────────────────┐
       │                                          │   StockBatch      │
       │                                          └───────────────────┘
       │
       │               ┌──────────────────┐      ┌───────────────────┐
       ├──────────────▶│    Supplier      │1──N▶│  PurchaseOrder    │
       │               └──────────────────┘      └────────┬──────────┘
       │                                                  │1:N
       │                                                  ▼
       │                                          ┌───────────────────┐
       │                                          │   POLineItem      │
       │                                          └───────────────────┘
       │
       │               ┌──────────────────┐
       ├──────────────▶│    Service        │
       │               └──────────────────┘
       │
       │               ┌──────────────────┐      ┌───────────────────┐
       ├──────────────▶│QCInspectionResult│1──N▶│   QCCheck         │
       │               └──────────────────┘      └───────────────────┘
       │
       │               ┌──────────────────┐
       ├──────────────▶│  ChecklistTpl    │1──N▶│  ChecklistItem    │
       │               └──────────────────┘      └───────────────────┘
       │
       │               ┌──────────────────┐
       ├──────────────▶│  Notification    │
       │               └──────────────────┘
       │
       │               ┌──────────────────┐
       ├──────────────▶│   Document       │
       │               └──────────────────┘
       │
       │               ┌──────────────────┐
       └──────────────▶│  AuditEntry      │
                        └──────────────────┘
```

---

# 4.2 Complete PostgreSQL Schema

## Schema: `mechanica`

### Table: `branches`

```sql
CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(10) NOT NULL UNIQUE,       -- e.g., "NYC01"
    name            VARCHAR(255) NOT NULL,
    address_line1   VARCHAR(255) NOT NULL,
    address_line2   VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    zip_code        VARCHAR(20) NOT NULL,
    country         VARCHAR(100) NOT NULL DEFAULT 'US',
    phone           VARCHAR(30),
    email           VARCHAR(255),
    tax_id          VARCHAR(50),                        -- Business tax ID
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    settings        JSONB NOT NULL DEFAULT '{}',        -- Branch-specific settings
    is_active       BOOLEAN NOT NULL DEFAULT true,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_code ON branches(code) WHERE deleted_at IS NULL;
CREATE INDEX idx_branches_active ON branches(is_active) WHERE deleted_at IS NULL;
```

### Table: `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(30),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    is_locked       BOOLEAN NOT NULL DEFAULT false,     -- Locked after failed attempts
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at   TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    refresh_token   TEXT,                               -- Hashed refresh token
    preferences     JSONB NOT NULL DEFAULT '{"theme":"light","locale":"en","timezone":"UTC"}',
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_email UNIQUE(email)
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;
```

### Table: `user_branch_assignments`

```sql
CREATE TABLE user_branch_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_branch UNIQUE(user_id, branch_id)
);

CREATE INDEX idx_uba_user ON user_branch_assignments(user_id);
CREATE INDEX idx_uba_branch ON user_branch_assignments(branch_id);
```

### Table: `roles`

```sql
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50) NOT NULL UNIQUE,        -- OWNER, MANAGER, RECEPTIONIST, MECHANIC, ACCOUNTANT, INVENTORY_MANAGER
    description     VARCHAR(255),
    is_system       BOOLEAN NOT NULL DEFAULT false,     -- System roles cannot be deleted
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Table: `user_roles`

```sql
CREATE TABLE user_roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE CASCADE,  -- NULL = global role
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by      UUID REFERENCES users(id),

    CONSTRAINT uq_user_role_branch UNIQUE(user_id, role_id, branch_id)
);

CREATE INDEX idx_ur_user ON user_roles(user_id);
CREATE INDEX idx_ur_role ON user_roles(role_id);
CREATE INDEX idx_ur_branch ON user_roles(branch_id);
```

### Table: `permissions`

```sql
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource        VARCHAR(100) NOT NULL,              -- e.g., "work_orders", "inventory"
    action          VARCHAR(50) NOT NULL,               -- CREATE, READ, UPDATE, DELETE, APPROVE, EXPORT
    scope           VARCHAR(20) NOT NULL DEFAULT 'BRANCH', -- GLOBAL, BRANCH, SELF
    CONSTRAINT uq_role_permission UNIQUE(role_id, resource, action)
);

CREATE INDEX idx_perm_role ON permissions(role_id);
CREATE INDEX idx_perm_resource ON permissions(resource);
```

### Table: `customers`

```sql
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    customer_type   VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, COMPANY
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    company_name    VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    phone_secondary VARCHAR(30),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    zip_code        VARCHAR(20),
    tax_id          VARCHAR(50),                        -- SSN/EIN/Tax ID
    notes           TEXT,
    tags            TEXT[],                             -- e.g., {"VIP","fleet","insurance"}
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_branch ON customers(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_customers_phone ON customers(phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_name ON customers(last_name, first_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tags ON customers USING GIN(tags) WHERE deleted_at IS NULL;
```

### Table: `vehicles`

```sql
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    vin             VARCHAR(17) NOT NULL,
    license_plate   VARCHAR(20),
    license_state   VARCHAR(50),
    make            VARCHAR(100),
    model           VARCHAR(100),
    year            SMALLINT,
    trim_level      VARCHAR(100),
    engine          VARCHAR(100),
    transmission    VARCHAR(50),
    drivetrain      VARCHAR(50),
    fuel_type       VARCHAR(50),
    color           VARCHAR(50),
    body_class      VARCHAR(100),
    manufacture_year SMALLINT,
    odometer        INTEGER,                            -- Current odometer reading
    odometer_unit   VARCHAR(5) NOT NULL DEFAULT 'mi',   -- mi or km
    notes           TEXT,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_vin UNIQUE(vin)
);

CREATE INDEX idx_vehicles_branch ON vehicles(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_vin ON vehicles(vin) WHERE deleted_at IS NULL;
CREATE INDEX idx_vehicles_plate ON vehicles(license_plate) WHERE deleted_at IS NULL AND license_plate IS NOT NULL;
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model) WHERE deleted_at IS NULL;
```

### Table: `customer_vehicles`

```sql
CREATE TABLE customer_vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    relationship    VARCHAR(50) DEFAULT 'OWNER',        -- OWNER, DRIVER, FLEET
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_customer_vehicle UNIQUE(customer_id, vehicle_id)
);

CREATE INDEX idx_cv_customer ON customer_vehicles(customer_id);
CREATE INDEX idx_cv_vehicle ON customer_vehicles(vehicle_id);
```

### Table: `services`

```sql
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    code            VARCHAR(50) NOT NULL,               -- e.g., "OIL_CHG", "BRAKE_FLUID"
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),                       -- MAINTENANCE, REPAIR, INSPECTION, BODY, DIAGNOSTIC
    default_rate    DECIMAL(10,2) NOT NULL DEFAULT 0,
    rate_unit       VARCHAR(10) NOT NULL DEFAULT 'HOURLY', -- HOURLY, FLAT
    estimated_hours DECIMAL(5,2),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_service_code_branch UNIQUE(code, branch_id)
);

CREATE INDEX idx_services_branch ON services(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_services_category ON services(category) WHERE deleted_at IS NULL;
```

### Table: `work_orders`

```sql
CREATE TABLE work_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    wo_number       VARCHAR(20) NOT NULL,               -- e.g., "WO-2024-00001"
    customer_id     UUID NOT NULL REFERENCES customers(id),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        -- OPEN, DIAGNOSED, WAITING_PARTS, IN_PROGRESS, QUALITY_CHECK, COMPLETED, DELIVERED
    priority        VARCHAR(10) NOT NULL DEFAULT 'NORMAL', -- LOW, NORMAL, HIGH, URGENT
    complaint       TEXT NOT NULL,                      -- Customer-reported issue
    diagnosis       TEXT,                               -- Mechanic diagnosis notes
    odometer_in     INTEGER,                            -- Odometer on check-in
    odometer_out    INTEGER,                            -- Odometer on delivery
    assigned_to     UUID REFERENCES users(id),          -- Primary mechanic
    estimated_total DECIMAL(12,2),
    actual_total    DECIMAL(12,2),
    promised_date   TIMESTAMPTZ,                        -- Promised completion date
    started_at      TIMESTAMPTZ,                        -- Actual start of work
    completed_at    TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    is_blocked      BOOLEAN NOT NULL DEFAULT false,     -- Blocked from delivery
    block_reason    VARCHAR(255),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wo_number UNIQUE(wo_number)
);

CREATE INDEX idx_wo_branch ON work_orders(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_status ON work_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_customer ON work_orders(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_vehicle ON work_orders(vehicle_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_mechanic ON work_orders(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_created ON work_orders(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_status_branch ON work_orders(branch_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_wo_promised ON work_orders(promised_date) WHERE deleted_at IS NULL AND promised_date IS NOT NULL;
```

### Table: `labor_entries`

```sql
CREATE TABLE labor_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    service_id      UUID NOT NULL REFERENCES services(id),
    mechanic_id     UUID NOT NULL REFERENCES users(id),
    description     VARCHAR(500),
    estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    actual_hours    DECIMAL(5,2) NOT NULL DEFAULT 0,
    rate            DECIMAL(10,2) NOT NULL,
    rate_unit       VARCHAR(10) NOT NULL DEFAULT 'HOURLY',
    line_total      DECIMAL(12,2) NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_le_wo ON labor_entries(work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_le_mechanic ON labor_entries(mechanic_id) WHERE deleted_at IS NULL;
```

### Table: `part_entries`

```sql
CREATE TABLE part_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    stock_item_id   UUID REFERENCES stock_items(id),
    part_number     VARCHAR(100) NOT NULL,
    part_name       VARCHAR(255) NOT NULL,
    quantity        DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total      DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_backorder    BOOLEAN NOT NULL DEFAULT false,
    batch_number    VARCHAR(100),
    serial_number   VARCHAR(100),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pe_wo ON part_entries(work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pe_stock ON part_entries(stock_item_id) WHERE deleted_at IS NULL AND stock_item_id IS NOT NULL;
```

### Table: `time_entries`

```sql
CREATE TABLE time_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    mechanic_id     UUID NOT NULL REFERENCES users(id),
    clock_in        TIMESTAMPTZ NOT NULL,
    clock_out       TIMESTAMPTZ,
    total_minutes   INTEGER,                            -- Computed on clock-out
    is_billable     BOOLEAN NOT NULL DEFAULT true,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_clock_out_after_in CHECK (clock_out IS NULL OR clock_out > clock_in)
);

CREATE INDEX idx_te_wo ON time_entries(work_order_id);
CREATE INDEX idx_te_mechanic ON time_entries(mechanic_id);
CREATE INDEX idx_te_date ON time_entries(clock_in, clock_out);
```

### Table: `work_notes`

```sql
CREATE TABLE work_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    note_type       VARCHAR(20) NOT NULL DEFAULT 'INTERNAL', -- INTERNAL, CUSTOMER, TECHNICAL
    content         TEXT NOT NULL,
    is_pinned       BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wn_wo ON work_notes(work_order_id) WHERE deleted_at IS NULL;
```

### Table: `wo_status_history`

```sql
CREATE TABLE wo_status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    changed_by      UUID NOT NULL REFERENCES users(id),
    reason          VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wosh_wo ON wo_status_history(work_order_id);
CREATE INDEX idx_wosh_created ON wo_status_history(created_at DESC);
```

### Table: `wo_attachments`

```sql
CREATE TABLE wo_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    document_id     UUID REFERENCES documents(id),
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(100),
    file_size       INTEGER,
    s3_key          VARCHAR(500) NOT NULL,
    category        VARCHAR(50) DEFAULT 'GENERAL',       -- INSPECTION, DAMAGE, REPAIR, INVOICE
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_woa_wo ON wo_attachments(work_order_id) WHERE deleted_at IS NULL;
```

### Table: `warehouses`

```sql
CREATE TABLE warehouses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_warehouse_code_branch UNIQUE(code, branch_id)
);

CREATE INDEX idx_wh_branch ON warehouses(branch_id) WHERE deleted_at IS NULL;
```

### Table: `stock_items`

```sql
CREATE TABLE stock_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id    UUID NOT NULL REFERENCES warehouses(id),
    sku             VARCHAR(100) NOT NULL,
    part_number     VARCHAR(100),                       -- OEM part number
    barcode         VARCHAR(100),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100),
    brand           VARCHAR(100),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'EA',  -- EA, BOX, LITER, KG
    quantity_on_hand DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_reserved DECIMAL(10,3) NOT NULL DEFAULT 0,
    quantity_available DECIMAL(10,3) GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    unit_cost       DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price   DECIMAL(10,2) NOT NULL DEFAULT 0,
    reorder_point   DECIMAL(10,3) NOT NULL DEFAULT 0,
    reorder_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    lead_time_days  INTEGER DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    track_batch     BOOLEAN NOT NULL DEFAULT false,
    track_serial    BOOLEAN NOT NULL DEFAULT false,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sku_warehouse UNIQUE(sku, warehouse_id),
    CONSTRAINT ck_non_negative_qty CHECK (quantity_on_hand >= 0),
    CONSTRAINT ck_non_negative_reserved CHECK (quantity_reserved >= 0)
);

CREATE INDEX idx_si_warehouse ON stock_items(warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_si_sku ON stock_items(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_si_category ON stock_items(category) WHERE deleted_at IS NULL;
CREATE INDEX idx_si_barcode ON stock_items(barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;
CREATE INDEX idx_si_low_stock ON stock_items(warehouse_id) WHERE deleted_at IS NULL AND (quantity_on_hand - quantity_reserved) <= reorder_point;
```

### Table: `stock_batches`

```sql
CREATE TABLE stock_batches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id   UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    batch_number    VARCHAR(100) NOT NULL,
    serial_number   VARCHAR(100),
    quantity        DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit_cost       DECIMAL(10,2),
    expiry_date     DATE,
    received_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_batch_serial UNIQUE(stock_item_id, batch_number, serial_number)
);

CREATE INDEX idx_sb_item ON stock_batches(stock_item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sb_batch ON stock_batches(batch_number);
CREATE INDEX idx_sb_expiry ON stock_batches(expiry_date) WHERE expiry_date IS NOT NULL;
```

### Table: `stock_movements`

```sql
CREATE TABLE stock_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id   UUID NOT NULL REFERENCES stock_items(id),
    batch_id        UUID REFERENCES stock_batches(id),
    movement_type   VARCHAR(30) NOT NULL,
        -- RECEIVING, SALE, ADJUSTMENT, TRANSFER_OUT, TRANSFER_IN, RETURN_TO_SUPPLIER, RETURN_FROM_CUSTOMER
    quantity        DECIMAL(10,3) NOT NULL,
    unit_cost       DECIMAL(10,2),
    reference_type  VARCHAR(50),                        -- work_order, purchase_order, transfer_order
    reference_id    UUID,
    notes           TEXT,
    performed_by    UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sm_item ON stock_movements(stock_item_id);
CREATE INDEX idx_sm_type ON stock_movements(movement_type);
CREATE INDEX idx_sm_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_sm_created ON stock_movements(created_at DESC);
CREATE INDEX idx_sm_batch ON stock_movements(batch_id);
```

### Table: `suppliers`

```sql
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(255),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    zip_code        VARCHAR(20),
    payment_terms   VARCHAR(100),                       -- NET30, NET60, etc.
    lead_time_days  INTEGER DEFAULT 0,
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_supplier_code_branch UNIQUE(code, branch_id)
);

CREATE INDEX idx_suppliers_branch ON suppliers(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE deleted_at IS NULL;
```

### Table: `purchase_orders`

```sql
CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    po_number       VARCHAR(30) NOT NULL,
    supplier_id     UUID NOT NULL REFERENCES suppliers(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        -- DRAFT, SENT, CONFIRMED, SHIPPED, PARTIAL, RECEIVED, CANCELLED
    order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date   DATE,
    received_date   DATE,
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total       DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_total  DECIMAL(12,2) NOT NULL DEFAULT 0,
    grand_total     DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes           TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_po_number UNIQUE(po_number)
);

CREATE INDEX idx_po_branch ON purchase_orders(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_po_status ON purchase_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_po_date ON purchase_orders(order_date DESC);
```

### Table: `po_line_items`

```sql
CREATE TABLE po_line_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    stock_item_id   UUID REFERENCES stock_items(id),
    line_number     INTEGER NOT NULL,
    part_number     VARCHAR(100) NOT NULL,
    description     VARCHAR(500) NOT NULL,
    quantity_ordered DECIMAL(10,3) NOT NULL DEFAULT 1,
    quantity_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total      DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes           TEXT,

    CONSTRAINT uq_po_line UNIQUE(purchase_order_id, line_number),
    CONSTRAINT ck_qty_received_lte_ordered CHECK (quantity_received <= quantity_ordered)
);

CREATE INDEX idx_po_line_po ON po_line_items(purchase_order_id);
CREATE INDEX idx_po_line_item ON po_line_items(stock_item_id);
```

### Table: `invoices`

```sql
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    invoice_number  VARCHAR(30) NOT NULL,               -- e.g., "INV-2024-00001"
    work_order_id   UUID NOT NULL REFERENCES work_orders(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        -- DRAFT, ISSUED, PARTIALLY_PAID, PAID, CANCELLED, CREDITED
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    subtotal        DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_type   VARCHAR(10),                        -- PERCENTAGE, FIXED
    discount_value  DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total       DECIMAL(12,2) NOT NULL DEFAULT 0,
    total           DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid     DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_due      DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
    notes           TEXT,
    pdf_generated   BOOLEAN NOT NULL DEFAULT false,
    pdf_s3_key      VARCHAR(500),
    cancelled_at    TIMESTAMPTZ,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_invoice_number UNIQUE(invoice_number),
    CONSTRAINT ck_total_non_negative CHECK (total >= 0),
    CONSTRAINT ck_amount_paid_non_negative CHECK (amount_paid >= 0)
);

CREATE INDEX idx_inv_branch ON invoices(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_wo ON invoices(work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_customer ON invoices(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_inv_date ON invoices(invoice_date DESC);
CREATE INDEX idx_inv_due ON invoices(due_date) WHERE status IN ('ISSUED', 'PARTIALLY_PAID');
```

### Table: `invoice_lines`

```sql
CREATE TABLE invoice_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_type       VARCHAR(20) NOT NULL,               -- LABOR, PART, MISC
    description     VARCHAR(500) NOT NULL,
    quantity        DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount        DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total      DECIMAL(12,2) NOT NULL DEFAULT 0,
    reference_type  VARCHAR(50),                        -- labor_entry, part_entry
    reference_id    UUID,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_il_invoice ON invoice_lines(invoice_id);
```

### Table: `tax_lines`

```sql
CREATE TABLE tax_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tax_name        VARCHAR(100) NOT NULL,
    tax_rate        DECIMAL(5,3) NOT NULL,              -- e.g., 0.080 = 8%
    tax_base        DECIMAL(12,2) NOT NULL,             -- Amount this tax applies to
    tax_amount      DECIMAL(12,2) NOT NULL,
    is_compound     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tl_invoice ON tax_lines(invoice_id);
```

### Table: `credit_notes`

```sql
CREATE TABLE credit_notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id),
    credit_number   VARCHAR(30) NOT NULL,
    reason          VARCHAR(500) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    created_by      UUID NOT NULL REFERENCES users(id),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_credit_number UNIQUE(credit_number)
);

CREATE INDEX idx_cn_invoice ON credit_notes(invoice_id);
```

### Table: `payments`

```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    amount          DECIMAL(12,2) NOT NULL,
    payment_method  VARCHAR(30) NOT NULL,                -- CASH, CARD, BANK_TRANSFER, CHECK
    reference_number VARCHAR(100),                      -- Transaction ID, Check Number
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    received_by     UUID NOT NULL REFERENCES users(id),
    notes           TEXT,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_pay_branch ON payments(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pay_date ON payments(paid_at DESC);
CREATE INDEX idx_pay_method ON payments(payment_method);
```

### Table: `payment_allocations`

```sql
CREATE TABLE payment_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id      UUID NOT NULL REFERENCES invoices(id),
    amount          DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_allocation_amount CHECK (amount > 0)
);

CREATE INDEX idx_pa_payment ON payment_allocations(payment_id);
CREATE INDEX idx_pa_invoice ON payment_allocations(invoice_id);
```

### Table: `checklist_templates`

```sql
CREATE TABLE checklist_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    name            VARCHAR(255) NOT NULL,
    service_type    VARCHAR(100),                        -- Links to service category
    is_active       BOOLEAN NOT NULL DEFAULT true,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ct_branch ON checklist_templates(branch_id) WHERE deleted_at IS NULL;
```

### Table: `checklist_items`

```sql
CREATE TABLE checklist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    description     VARCHAR(500) NOT NULL,
    is_required     BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ci_template ON checklist_items(checklist_template_id);
```

### Table: `qc_inspection_results`

```sql
CREATE TABLE qc_inspection_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id   UUID NOT NULL REFERENCES work_orders(id),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    checklist_template_id UUID NOT NULL REFERENCES checklist_templates(id),
    inspector_id    UUID NOT NULL REFERENCES users(id),
    result          VARCHAR(10) NOT NULL,                -- PASS, FAIL
    notes           TEXT,
    inspected_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qc_wo ON qc_inspection_results(work_order_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_qc_inspector ON qc_inspection_results(inspector_id);
CREATE INDEX idx_qc_result ON qc_inspection_results(result);
```

### Table: `qc_checks`

```sql
CREATE TABLE qc_checks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qc_result_id    UUID NOT NULL REFERENCES qc_inspection_results(id) ON DELETE CASCADE,
    checklist_item_id UUID NOT NULL REFERENCES checklist_items(id),
    passed          BOOLEAN NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_qcc_result ON qc_checks(qc_result_id);
```

### Table: `notifications`

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            VARCHAR(50) NOT NULL,                -- WO_STATUS_CHANGE, PARTS_ARRIVED, QC_RESULT, PAYMENT_RECEIVED
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    data            JSONB,                               -- Additional payload
    reference_type  VARCHAR(50),
    reference_id    UUID,
    is_read         BOOLEAN NOT NULL DEFAULT false,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notif_created ON notifications(created_at DESC);
```

### Table: `documents`

```sql
CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID NOT NULL REFERENCES branches(id),
    file_name       VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size       INTEGER NOT NULL,
    s3_key          VARCHAR(500) NOT NULL,
    category        VARCHAR(50),                         -- INVOICE, INSPECTION, REPAIR_PHOTO, MANUAL
    entity_type     VARCHAR(50),                         -- work_order, vehicle, customer
    entity_id       UUID,
    version         INTEGER NOT NULL DEFAULT 1,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    checksum        VARCHAR(64),                         -- SHA-256 for integrity
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_branch ON documents(branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_entity ON documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_docs_category ON documents(category) WHERE deleted_at IS NULL;
```

### Table: `audit_entries`

```sql
CREATE TABLE audit_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id       UUID REFERENCES branches(id),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,                -- CREATE, UPDATE, DELETE, APPROVE, LOGIN, LOGOUT
    entity_type     VARCHAR(100) NOT NULL,               -- work_order, invoice, customer, etc.
    entity_id       UUID NOT NULL,
    entity_label    VARCHAR(255),                        -- Human-readable reference
    old_values      JSONB,                               -- Previous state (before change)
    new_values      JSONB,                               -- New state (after change)
    changes         JSONB,                               -- Array of {field, from, to}
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    checksum        VARCHAR(64),                         -- Hash of (previous_entry_checksum + action + entity + timestamp)
    previous_checksum VARCHAR(64),                       -- Link to previous audit entry
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_branch ON audit_entries(branch_id);
CREATE INDEX idx_audit_user ON audit_entries(user_id);
CREATE INDEX idx_audit_entity ON audit_entries(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_entries(action);
CREATE INDEX idx_audit_created ON audit_entries(created_at DESC);
CREATE INDEX idx_audit_checksum ON audit_entries(checksum);
```

### Table: `transfer_orders`

```sql
CREATE TABLE transfer_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(30) NOT NULL,
    from_branch_id  UUID NOT NULL REFERENCES branches(id),
    to_branch_id    UUID NOT NULL REFERENCES branches(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        -- DRAFT, PENDING, IN_TRANSIT, RECEIVED, CANCELLED
    requested_by    UUID NOT NULL REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    shipped_at      TIMESTAMPTZ,
    received_at     TIMESTAMPTZ,
    notes           TEXT,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_transfer_number UNIQUE(transfer_number)
);

CREATE INDEX idx_to_from ON transfer_orders(from_branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_to_to ON transfer_orders(to_branch_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_to_status ON transfer_orders(status) WHERE deleted_at IS NULL;
```

### Table: `transfer_order_items`

```sql
CREATE TABLE transfer_order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_order_id UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    stock_item_id   UUID NOT NULL REFERENCES stock_items(id),
    quantity        DECIMAL(10,3) NOT NULL,
    quantity_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    batch_number    VARCHAR(100),
    serial_number   VARCHAR(100),

    CONSTRAINT ck_tfr_qty CHECK (quantity > 0)
);

CREATE INDEX idx_toi_transfer ON transfer_order_items(transfer_order_id);
CREATE INDEX idx_toi_item ON transfer_order_items(stock_item_id);
```

---

# 4.3 Indexing Strategy

| Table | Index Name | Type | Columns | Purpose |
|-------|-----------|------|---------|---------|
| work_orders | idx_wo_status_branch | B-tree | (branch_id, status) | Kanban board queries |
| work_orders | idx_wo_created | B-tree | created_at DESC | Dashboard recent WOs |
| work_orders | idx_wo_customer | B-tree | customer_id | Customer history |
| work_orders | idx_wo_vehicle | B-tree | vehicle_id | Vehicle timeline |
| stock_items | idx_si_low_stock | Partial B-tree | warehouse_id WHERE (qty - reserved) <= reorder | Reorder alerts |
| stock_items | idx_si_barcode | B-tree | barcode | Scanner lookup |
| invoices | idx_inv_due | Partial B-tree | due_date WHERE status IN ('ISSUED','PARTIALLY_PAID') | Overdue tracking |
| notifications | idx_notif_unread | Partial B-tree | (user_id, is_read) WHERE is_read=false | Unread count |
| audit_entries | idx_audit_entity | B-tree | (entity_type, entity_id) | Entity history |
| audit_entries | idx_audit_checksum | B-tree | checksum | Tamper detection |
| time_entries | idx_te_date | B-tree | (clock_in, clock_out) | Time range queries |
| customers | idx_customers_name | B-tree | (last_name, first_name) | Customer search |
| vehicles | idx_vehicles_vin | B-tree | vin | VIN lookup |
| vehicles | idx_vehicles_plate | B-tree | license_plate | Plate lookup |

## Full-Text Search Strategy

For customer and vehicle search, use PostgreSQL GIN indexes with `tsvector`:

```sql
ALTER TABLE customers ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
    ) STORED;

CREATE INDEX idx_customers_search ON customers USING GIN(search_vector) WHERE deleted_at IS NULL;

ALTER TABLE vehicles ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(vin, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(license_plate, ''))
    ) STORED;

CREATE INDEX idx_vehicles_search ON vehicles USING GIN(search_vector) WHERE deleted_at IS NULL;
```

---

# 4.4 Partitioning Strategy

## Partitioning Target: `audit_entries`

Expected to grow fastest (every entity change is logged). Partition by month:

```sql
CREATE TABLE audit_entries (
    id              UUID NOT NULL,
    branch_id       UUID,
    user_id         UUID,
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(100) NOT NULL,
    entity_id       UUID NOT NULL,
    entity_label    VARCHAR(255),
    old_values      JSONB,
    new_values      JSONB,
    changes         JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    checksum        VARCHAR(64),
    previous_checksum VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_entries_2024_01 PARTITION OF audit_entries
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE audit_entries_2024_02 PARTITION OF audit_entries
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... monthly partitions
```

## Partitioning Target: `stock_movements`

Partition by month as well, given high transaction volume.

## Partitioning Target: `time_entries`

Partition by month for payroll/time analysis queries.

---

# 4.5 Soft Delete Strategy

All major entities use soft delete via `deleted_at` TIMESTAMPTZ column.

**Rules:**
- `deleted_at IS NULL` = record is active
- `deleted_at IS NOT NULL` = record is deleted (invisible to queries)
- All queries must include `WHERE deleted_at IS NULL` (enforced via Prisma middleware)
- Unique constraints must include `WHERE deleted_at IS NULL` (partial unique indexes)
- On soft delete: set `deleted_at = NOW()` and append `_deleted_{timestamp}` to unique fields if needed
- Hard delete only for: audit_entries (retention policy), notifications (read after 90 days), temp data

Example partial unique index:

```sql
-- Allow re-use of soft-deleted emails
DROP INDEX IF EXISTS uq_users_email;
CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL;
```

---

# 4.6 Audit Strategy

## Audit Levels

| Level | Description | Examples |
|-------|-------------|----------|
| CRITICAL | All mutations logged with full before/after | Work order status, payments, invoice status |
| STANDARD | All mutations logged with changes diff | Customer update, vehicle update, stock adjustment |
| MINIMAL | Only create/delete logged | Notes, attachments |
| READ | Read access logged (only for sensitive data) | Customer PII, financial data view |

## Implementation

**Application-level (Prisma middleware):**
```typescript
// Prisma middleware captures before/after state for all models
prisma.$use(async (params, next) => {
  const result = await next(params);
  // Capture action, model, before/after state
  // Create AuditEntry record
  return result;
});
```

**Audit Entry Checksum Chain (Tamper Detection):**
```
previous_entry_hash = SHA256(previous_checksum + action + entity_id + new_values + timestamp)

audit_entry_1: checksum = SHA256("" + "CREATE" + "WO-001" + "{}" + "2024-01-01T00:00:00Z")
audit_entry_2: checksum = SHA256(audit_entry_1.checksum + "UPDATE" + "WO-001" + "{"status":"IN_PROGRESS"}" + "2024-01-01T01:00:00Z")
```

Any tampering with past entries breaks the chain, detectable by recomputing all checksums.

---

# 4.7 Entity Summary (Count: 36 Tables)

| # | Table | Module | Row Est. | Growth Rate |
|---|-------|--------|----------|-------------|
| 1 | branches | Multi-Branch | < 100 | Static |
| 2 | users | IAM | < 500 | Slow |
| 3 | user_branch_assignments | IAM | < 1000 | Slow |
| 4 | roles | IAM | < 20 | Static |
| 5 | user_roles | IAM | < 1000 | Slow |
| 6 | permissions | IAM | < 200 | Static |
| 7 | customers | Customer | 10K-100K | Medium |
| 8 | vehicles | Vehicle | 10K-100K | Medium |
| 9 | customer_vehicles | Customer | 10K-100K | Medium |
| 10 | services | Labor | < 500 | Slow |
| 11 | work_orders | Work Order | 100K-1M | High |
| 12 | labor_entries | Work Order | 200K-2M | High |
| 13 | part_entries | Work Order | 200K-2M | High |
| 14 | time_entries | Work Order | 500K-5M | Very High |
| 15 | work_notes | Work Order | 100K-500K | Medium |
| 16 | wo_status_history | Work Order | 500K-5M | Very High |
| 17 | wo_attachments | Work Order | 50K-200K | Medium |
| 18 | warehouses | Inventory | < 500 | Static |
| 19 | stock_items | Inventory | 5K-50K | Slow |
| 20 | stock_batches | Inventory | 20K-200K | Medium |
| 21 | stock_movements | Inventory | 500K-5M | Very High |
| 22 | suppliers | Purchasing | < 1000 | Slow |
| 23 | purchase_orders | Purchasing | 10K-100K | Medium |
| 24 | po_line_items | Purchasing | 50K-500K | Medium |
| 25 | invoices | Invoicing | 100K-500K | High |
| 26 | invoice_lines | Invoicing | 500K-2.5M | High |
| 27 | tax_lines | Invoicing | 200K-1M | High |
| 28 | credit_notes | Invoicing | 5K-25K | Low |
| 29 | payments | Payments | 100K-500K | High |
| 30 | payment_allocations | Payments | 100K-500K | High |
| 31 | checklist_templates | QC | < 200 | Static |
| 32 | checklist_items | QC | < 2000 | Static |
| 33 | qc_inspection_results | QC | 50K-500K | Medium |
| 34 | qc_checks | QC | 200K-2M | Medium |
| 35 | notifications | Notifications | 500K-5M | Very High |
| 36 | documents | Documents | 10K-100K | Medium |
| 37 | audit_entries | Audit | 5M-50M | Extreme |
| 38 | transfer_orders | Multi-Branch | 1K-10K | Low |
| 39 | transfer_order_items | Multi-Branch | 5K-50K | Low |

---

*End of Phase 4 — Database Design*
