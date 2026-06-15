# Phase 6 — API Design

## Platform: Mechanica
## Format: OpenAPI 3.0 / REST
## Document Version: 1.0

---

# 6.1 API Standards

## Base URL

```
Production:  https://api.mechanica.app/v1
Staging:     https://api-staging.mechanica.app/v1
Local:       http://localhost:4000/v1
```

## URL Conventions

- Plural nouns for resources: `/work-orders`, `/vehicles`
- Nested for sub-resources: `/work-orders/:id/labor`
- Kebab-case for multi-word resources: `/work-orders`, `/stock-items`
- UUID v4 for resource identifiers
- Query parameters for filtering, sorting, pagination

## HTTP Methods

| Method | Action | Idempotent | Safe |
|--------|--------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Full update | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Delete resource | Yes | No |

## Response Envelope

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Paginated Success Response

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "pageSize": 25,
    "totalCount": 142,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required",
        "code": "REQUIRED"
      }
    ],
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Standard Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 400 | INVALID_STATUS_TRANSITION | Invalid workflow status change |
| 400 | INSUFFICIENT_STOCK | Not enough inventory |
| 401 | UNAUTHORIZED | Missing or invalid auth token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., duplicate) |
| 422 | BUSINESS_RULE_VIOLATION | Domain invariant violated |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Temporary maintenance or overload |

## Pagination Standards

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| page | integer | 1 | — | Page number (1-indexed) |
| pageSize | integer | 25 | 100 | Items per page |

## Filtering Standards

Filter format: `?filter[field]=value`

```
GET /work-orders?filter[status]=IN_PROGRESS
GET /work-orders?filter[status][in]=IN_PROGRESS,DIAGNOSED
GET /work-orders?filter[createdAt][gte]=2024-01-01
GET /work-orders?filter[createdAt][lte]=2024-01-31
GET /work-orders?filter[customerId]=uuid
```

Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `like` (case-insensitive contains)

## Sorting Standards

```
GET /work-orders?sort=-createdAt         ← Descending
GET /work-orders?sort=createdAt          ← Ascending
GET /work-orders?sort=-priority,createdAt ← Multi-field
```

## Date Format

ISO 8601: `2024-01-15T10:30:00Z` (UTC, always)

## Money Format

Decimal(12,2) as JSON number: `1234.56`

---

# 6.2 Authentication Endpoints

```
POST   /api/v1/auth/login                    → Login (email + password)
POST   /api/v1/auth/refresh                  → Refresh access token
POST   /api/v1/auth/logout                   → Invalidate refresh token
POST   /api/v1/auth/forgot-password           → Send reset email
POST   /api/v1/auth/reset-password            → Reset password with token
GET    /api/v1/auth/me                        → Current user profile
PUT    /api/v1/auth/change-password           → Change password
```

### POST /auth/login

**Request:**
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8)"
}
```

**Response (200):**
```json
{
  "accessToken": "string (JWT, 15 min expiry)",
  "refreshToken": "string (opaque, 7 day expiry)",
  "user": {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "roles": ["string"],
    "branches": [
      {
        "id": "uuid",
        "code": "string",
        "name": "string",
        "isPrimary": "boolean"
      }
    ],
    "permissions": ["string"]
  }
}
```

---

# 6.3 IAM Endpoints

```
GET    /api/v1/users                         → List users (paginated)
POST   /api/v1/users                         → Create user
GET    /api/v1/users/:id                     → User detail
PUT    /api/v1/users/:id                     → Update user
DELETE /api/v1/users/:id                     → Soft delete user
PUT    /api/v1/users/:id/roles               → Update user roles
PUT    /api/v1/users/:id/branches            → Update branch assignments
POST   /api/v1/users/:id/lock                → Lock user account
POST   /api/v1/users/:id/unlock              → Unlock user account
GET    /api/v1/roles                         → List roles
POST   /api/v1/roles                         → Create role
PUT    /api/v1/roles/:id                     → Update role
DELETE /api/v1/roles/:id                     → Delete role
GET    /api/v1/roles/:id/permissions         → Get role permissions
PUT    /api/v1/roles/:id/permissions         → Update role permissions
```

### POST /users

**Request:**
```json
{
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 12, must include uppercase, lowercase, number, special)",
  "firstName": "string (required, max 100)",
  "lastName": "string (required, max 100)",
  "phone": "string (optional)",
  "roleIds": ["uuid (required, at least 1)"],
  "branchIds": ["uuid (required, at least 1)"],
  "isActive": "boolean (optional, default true)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "isActive": true,
  "roles": [
    {
      "id": "uuid",
      "name": "MECHANIC"
    }
  ],
  "branches": [
    {
      "id": "uuid",
      "code": "NYC01",
      "name": "New York Downtown"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

# 6.4 Customer Endpoints

```
GET    /api/v1/customers                     → List customers (paginated, searchable)
GET    /api/v1/customers/:id                 → Customer detail with vehicles
POST   /api/v1/customers                     → Create customer
PUT    /api/v1/customers/:id                 → Update customer
DELETE /api/v1/customers/:id                 → Soft delete customer
GET    /api/v1/customers/:id/vehicles        → Customer vehicles
POST   /api/v1/customers/:id/vehicles        → Link vehicle to customer
DELETE /api/v1/customers/:id/vehicles/:vId   → Unlink vehicle
GET    /api/v1/customers/:id/work-orders     → Customer work orders
```

### GET /customers

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| filter[search] | string | Full-text search across name, email, phone |
| filter[email] | string | Exact email match |
| filter[phone] | string | Phone search |
| filter[customerType] | enum | INDIVIDUAL, COMPANY |
| filter[tags] | string | Tag filter (comma-separated) |
| sort | string | Sort field |
| page | integer | Page number |
| pageSize | integer | Items per page (max 100) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "customerType": "INDIVIDUAL",
      "firstName": "John",
      "lastName": "Doe",
      "companyName": null,
      "email": "john@example.com",
      "phone": "+1234567890",
      "vehicleCount": 2,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": { "page": 1, "pageSize": 25, "totalCount": 142, ... }
}
```

---

# 6.5 Vehicle Endpoints

```
GET    /api/v1/vehicles                      → List vehicles (paginated, searchable)
GET    /api/v1/vehicles/:id                  → Vehicle detail with history
POST   /api/v1/vehicles                      → Create vehicle
PUT    /api/v1/vehicles/:id                  → Update vehicle
DELETE /api/v1/vehicles/:id                  → Soft delete vehicle
GET    /api/v1/vehicles/by-vin/:vin          → Lookup by VIN
POST   /api/v1/vehicles/decode-vin           → Decode VIN
GET    /api/v1/vehicles/:id/work-orders      → Vehicle work order timeline
GET    /api/v1/vehicles/:id/documents        → Vehicle documents
```

### POST /vehicles

**Request:**
```json
{
  "vin": "string (required, 17 chars, regex: ^[A-HJ-NPR-Z0-9]{17}$)",
  "licensePlate": "string (optional, max 20)",
  "licenseState": "string (optional, max 50)",
  "color": "string (optional, max 50)",
  "odometer": "integer (optional)",
  "odometerUnit": "string (optional, default: 'mi', enum: mi, km)",
  "customerIds": ["uuid (optional, at least 1 if provided)"],
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "vin": "1HGCM82633A123456",
  "make": "HONDA",
  "model": "ACCORD",
  "year": 2023,
  "trim": "EX-L",
  "engine": "1.5L I4 Turbo",
  "transmission": "CVT",
  "drivetrain": "FWD",
  "fuelType": "GASOLINE",
  "color": "Blue",
  "licensePlate": "ABC1234",
  "odometer": 15000,
  "odometerUnit": "mi",
  "customers": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "OWNER"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### POST /vehicles/decode-vin

**Request:**
```json
{
  "vin": "1HGCM82633A123456"
}
```

**Response (200):**
```json
{
  "vin": "1HGCM82633A123456",
  "make": "HONDA",
  "model": "ACCORD",
  "year": 2023,
  "trim": "EX-L",
  "engine": "1.5L I4 Turbo",
  "transmission": "CVT",
  "drivetrain": "FWD",
  "fuelType": "GASOLINE",
  "bodyClass": "Sedan/Saloon",
  "manufactureYear": 2023,
  "isValid": true
}
```

---

# 6.6 Work Order Endpoints

```
GET    /api/v1/work-orders                   → List WOs (paginated, heavily filterable)
GET    /api/v1/work-orders/kanban            → WOs grouped by status (Kanban board)
GET    /api/v1/work-orders/:id               → WO detail (all relations)
POST   /api/v1/work-orders                   → Create WO
PUT    /api/v1/work-orders/:id               → Update WO
DELETE /api/v1/work-orders/:id               → Soft delete WO
PATCH  /api/v1/work-orders/:id/status        → Change status
POST   /api/v1/work-orders/:id/assign        → Assign mechanic
POST   /api/v1/work-orders/:id/labor         → Add labor entry
PUT    /api/v1/work-orders/:id/labor/:labId  → Update labor entry
DELETE /api/v1/work-orders/:id/labor/:labId  → Remove labor entry
POST   /api/v1/work-orders/:id/parts         → Add part entry
PUT    /api/v1/work-orders/:id/parts/:partId → Update part entry
DELETE /api/v1/work-orders/:id/parts/:partId → Remove part entry
POST   /api/v1/work-orders/:id/time          → Clock in/out
GET    /api/v1/work-orders/:id/time          → Time entries
POST   /api/v1/work-orders/:id/notes         → Add note
PUT    /api/v1/work-orders/:id/notes/:noteId → Update note
DELETE /api/v1/work-orders/:id/notes/:noteId → Delete note
POST   /api/v1/work-orders/:id/attachments   → Upload attachment
DELETE /api/v1/work-orders/:id/attachments/:attId → Delete attachment
GET    /api/v1/work-orders/:id/history       → Status change history
```

### GET /work-orders (filterable)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| filter[status] | enum | OPEN, DIAGNOSED, WAITING_PARTS, IN_PROGRESS, QUALITY_CHECK, COMPLETED, DELIVERED |
| filter[status][in] | string | Comma-separated statuses |
| filter[customerId] | uuid | Filter by customer |
| filter[vehicleId] | uuid | Filter by vehicle |
| filter[assignedTo] | uuid | Filter by mechanic |
| filter[createdAt][gte] | date | Created after |
| filter[createdAt][lte] | date | Created before |
| filter[priority] | enum | LOW, NORMAL, HIGH, URGENT |
| filter[search] | string | Search WO number, customer name, VIN |
| sort | string | Sort field (default: -createdAt) |
| page | integer | Page number |
| pageSize | integer | Items per page |

### POST /work-orders

**Request:**
```json
{
  "customerId": "uuid (required)",
  "vehicleId": "uuid (required)",
  "complaint": "string (required, max 2000)",
  "priority": "string (optional, default: NORMAL, enum: LOW, NORMAL, HIGH, URGENT)",
  "odometer": "integer (optional)",
  "promisedDate": "datetime (optional)",
  "assignedTo": "uuid (optional, mechanic ID)",
  "notes": "string (optional, internal note)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "woNumber": "WO-2024-00042",
  "status": "OPEN",
  "customer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  },
  "vehicle": {
    "id": "uuid",
    "vin": "1HGCM82633A123456",
    "make": "HONDA",
    "model": "ACCORD",
    "year": 2023,
    "licensePlate": "ABC1234"
  },
  "complaint": "Check engine light on, rough idle",
  "priority": "HIGH",
  "statusHistory": [
    {
      "fromStatus": null,
      "toStatus": "OPEN",
      "changedBy": "uuid",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### PATCH /work-orders/:id/status

**Request:**
```json
{
  "status": "DIAGNOSED (required, valid transition)",
  "reason": "string (optional, max 500)"
}
```

**Error Codes:**
| Code | HTTP | Description |
|------|------|-------------|
| INVALID_STATUS_TRANSITION | 400 | Cannot transition from current to requested status |
| WORK_ORDER_NOT_FOUND | 404 | Work order not found |
| MISSING_REQUIREMENT | 422 | Status requires specific data (e.g., diagnosis notes for DIAGNOSED) |

### GET /work-orders/kanban

**Response (200):**
```json
{
  "data": {
    "OPEN": {
      "count": 3,
      "items": [
        {
          "id": "uuid",
          "woNumber": "WO-2024-00042",
          "customerName": "John Doe",
          "vehicle": "HONDA ACCORD - ABC1234",
          "priority": "HIGH",
          "assignedTo": { "id": "uuid", "firstName": "Carlos", "lastName": "Mendez" },
          "timeInStatus": "2h 15m",
          "partsWaiting": false
        }
      ]
    },
    "DIAGNOSED": { "count": 5, "items": [...] },
    "WAITING_PARTS": { "count": 2, "items": [...] },
    "IN_PROGRESS": { "count": 4, "items": [...] },
    "QUALITY_CHECK": { "count": 1, "items": [...] },
    "COMPLETED": { "count": 3, "items": [...] },
    "DELIVERED": { "count": 0, "items": [] }
  }
}
```

---

# 6.7 Inventory Endpoints

```
GET    /api/v1/inventory/items               → List stock items
GET    /api/v1/inventory/items/:id           → Item detail with stock level
POST   /api/v1/inventory/items               → Create stock item
PUT    /api/v1/inventory/items/:id           → Update stock item
DELETE /api/v1/inventory/items/:id           → Soft delete item
GET    /api/v1/inventory/items/:id/batches   → Batch/serial list
POST   /api/v1/inventory/items/:id/adjust    → Adjust quantity
GET    /api/v1/inventory/warehouses          → List warehouses
POST   /api/v1/inventory/warehouses          → Create warehouse
GET    /api/v1/inventory/movements           → Stock movement history
GET    /api/v1/inventory/low-stock           → Below-reorder-point items
GET    /api/v1/inventory/valuation           → Valuation report
```

### GET /inventory/items (filterable)

| Param | Type | Description |
|-------|------|-------------|
| filter[search] | string | Search by SKU, name, part number, barcode |
| filter[category] | string | Category filter |
| filter[warehouseId] | uuid | Warehouse filter |
| filter[lowStock] | boolean | Only items below reorder point |

### POST /inventory/items

**Request:**
```json
{
  "warehouseId": "uuid (required)",
  "sku": "string (required, unique per warehouse, max 100)",
  "partNumber": "string (optional, OEM part number)",
  "barcode": "string (optional)",
  "name": "string (required, max 255)",
  "description": "string (optional)",
  "category": "string (optional, max 100)",
  "brand": "string (optional, max 100)",
  "unitOfMeasure": "string (optional, default: EA)",
  "unitCost": "number (required, >= 0)",
  "sellingPrice": "number (required, >= 0)",
  "reorderPoint": "number (optional, default: 0)",
  "reorderQuantity": "number (optional, default: 0)",
  "leadTimeDays": "integer (optional, default: 0)",
  "trackBatch": "boolean (optional, default: false)",
  "trackSerial": "boolean (optional, default: false)"
}
```

---

# 6.8 Invoicing Endpoints

```
GET    /api/v1/invoices                      → List invoices
GET    /api/v1/invoices/:id                  → Invoice detail
POST   /api/v1/invoices                      → Create manually
PUT    /api/v1/invoices/:id                  → Update draft invoice
PATCH  /api/v1/invoices/:id/status           → Update status
POST   /api/v1/invoices/from-wo/:woId        → Generate from work order
GET    /api/v1/invoices/:id/pdf              → Download PDF
POST   /api/v1/invoices/:id/credit-note      → Create credit note
GET    /api/v1/invoices/:id/credit-notes     → List credit notes
```

### POST /invoices/from-wo/:woId

**Response (201):**
```json
{
  "id": "uuid",
  "invoiceNumber": "INV-2024-00142",
  "workOrderId": "uuid",
  "customer": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe"
  },
  "status": "DRAFT",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-14",
  "lines": [
    {
      "lineType": "LABOR",
      "description": "Oil Change Service",
      "quantity": 1.5,
      "unitPrice": 120.00,
      "lineTotal": 180.00
    },
    {
      "lineType": "PART",
      "description": "Oil Filter - OEM",
      "quantity": 1,
      "unitPrice": 15.50,
      "lineTotal": 15.50
    }
  ],
  "taxLines": [
    {
      "taxName": "Sales Tax",
      "taxRate": 0.08,
      "taxBase": 195.50,
      "taxAmount": 15.64
    }
  ],
  "subtotal": 195.50,
  "taxTotal": 15.64,
  "total": 211.14,
  "amountPaid": 0,
  "amountDue": 211.14
}
```

### PATCH /invoices/:id/status

**Request:**
```json
{
  "status": "ISSUED"
}
```

---

# 6.9 Payment Endpoints

```
GET    /api/v1/payments                      → List payments
GET    /api/v1/payments/:id                  → Payment detail
POST   /api/v1/payments                      → Record payment
POST   /api/v1/payments/:id/refund           → Refund payment
GET    /api/v1/payments/invoice/:invId       → Payments for invoice
```

### POST /payments

**Request:**
```json
{
  "amount": "number (required, > 0)",
  "paymentMethod": "string (required, enum: CASH, CARD, BANK_TRANSFER, CHECK)",
  "referenceNumber": "string (optional, card last4, check number, transaction ID)",
  "paidAt": "datetime (optional, default: now)",
  "allocations": [
    {
      "invoiceId": "uuid (required)",
      "amount": "number (required, > 0, must not exceed invoice balance)"
    }
  ],
  "notes": "string (optional)"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "amount": 211.14,
  "paymentMethod": "CARD",
  "referenceNumber": "****4242",
  "paidAt": "2024-01-15T11:00:00Z",
  "allocations": [
    {
      "invoiceId": "uuid",
      "invoiceNumber": "INV-2024-00142",
      "amount": 211.14
    }
  ],
  "createdAt": "2024-01-15T11:00:00Z"
}
```

---

# 6.10 QC Endpoints

```
GET    /api/v1/qc/templates                  → List inspection templates
POST   /api/v1/qc/templates                  → Create template
PUT    /api/v1/qc/templates/:id              → Update template
DELETE /api/v1/qc/templates/:id              → Delete template
POST   /api/v1/qc/templates/:id/items        → Add check item
DELETE /api/v1/qc/templates/:id/items/:itemId → Remove item
GET    /api/v1/qc/inspections                → List inspections
POST   /api/v1/qc/inspections                → Start inspection
GET    /api/v1/qc/inspections/:id            → Inspection detail
PUT    /api/v1/qc/inspections/:id/check/:checkId → Update check
PATCH  /api/v1/qc/inspections/:id/complete   → Finalize inspection
GET    /api/v1/qc/blocked                    → Blocked deliveries
PATCH  /api/v1/qc/blocked/:woId/override     → Override block
```

---

# 6.11 Dashboard Endpoints

```
GET    /api/v1/dashboard/kpi                 → KPI data
GET    /api/v1/dashboard/charts/revenue      → Revenue chart data
GET    /api/v1/dashboard/charts/wo-status    → WO status distribution
GET    /api/v1/dashboard/charts/mechanic-load → Mechanic workload
GET    /api/v1/dashboard/activity            → Activity feed (paginated)
```

### GET /dashboard/kpi

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| branchId | uuid | Optional branch filter |

**Response (200):**
```json
{
  "data": {
    "activeWorkOrders": {
      "value": 14,
      "change": 2,
      "changeType": "INCREASE"
    },
    "waitingParts": {
      "value": 3,
      "change": -1,
      "changeType": "DECREASE"
    },
    "revenueToday": {
      "value": 4580.50,
      "change": 320.00,
      "changeType": "INCREASE"
    },
    "mechanicUtilization": {
      "value": 78.5,
      "change": 5.2,
      "changeType": "INCREASE",
      "unit": "percent"
    },
    "avgRepairTime": {
      "value": 3.2,
      "change": -0.5,
      "changeType": "DECREASE",
      "unit": "hours"
    },
    "qcPassRate": {
      "value": 92.3,
      "change": 1.8,
      "changeType": "INCREASE",
      "unit": "percent"
    }
  }
}
```

---

# 6.12 Notification Endpoints

```
GET    /api/v1/notifications                 → List notifications (paginated)
GET    /api/v1/notifications/unread-count     → Unread count
PATCH  /api/v1/notifications/:id/read        → Mark as read
PATCH  /api/v1/notifications/read-all        → Mark all as read
```

---

# 6.13 Document Endpoints

```
POST   /api/v1/documents/upload              → Upload file (multipart)
GET    /api/v1/documents/:id                 → Download (signed URL redirect)
DELETE /api/v1/documents/:id                 → Soft delete
GET    /api/v1/documents/:id/versions        → Version history
GET    /api/v1/documents/entity/:type/:id    → Entity documents
```

### POST /documents/upload

**Request:** `multipart/form-data`
| Field | Type | Required |
|-------|------|----------|
| file | binary | Yes |
| category | string | No |
| entityType | string | Conditional |
| entityId | uuid | Conditional |

**File Constraints:**
- Max size: 25 MB
- Allowed types: image/jpeg, image/png, image/gif, application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

**Response (201):**
```json
{
  "id": "uuid",
  "fileName": "repair-photo-1.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 245000,
  "category": "REPAIR_PHOTO",
  "url": "https://s3.amazonaws.com/mechanica-documents/abc123.jpg?signature=..."
}
```

---

# 6.14 Report Endpoints

```
GET    /api/v1/reports/financial/pnl             → P&L report
GET    /api/v1/reports/financial/revenue          → Revenue report
GET    /api/v1/reports/financial/tax              → Tax summary
GET    /api/v1/reports/financial/ar               → AR aging
GET    /api/v1/reports/workshop/jobs              → Jobs completed
GET    /api/v1/reports/workshop/avg-time          → Avg repair time
GET    /api/v1/reports/workshop/status-distribution → Status distribution
GET    /api/v1/reports/mechanics/productivity     → Mechanic productivity
GET    /api/v1/reports/mechanics/utilization      → Utilization
GET    /api/v1/reports/inventory/valuation        → Stock valuation
GET    /api/v1/reports/inventory/slow-movers      → Slow movers
GET    /api/v1/reports/inventory/reorder          → Reorder suggestions
```

### Common Report Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| branchId | uuid | Branch filter |
| dateFrom | date | Start date (required for most) |
| dateTo | date | End date (required for most) |
| groupBy | string | day, week, month, year |
| format | string | json (default), csv, xlsx |

---

# 6.15 Multi-Branch Endpoints

```
GET    /api/v1/branches                      → List branches
POST   /api/v1/branches                      → Create branch
GET    /api/v1/branches/:id                  → Branch detail
PUT    /api/v1/branches/:id                  → Update branch
GET    /api/v1/transfers                     → List transfer orders
POST   /api/v1/transfers                     → Create transfer
GET    /api/v1/transfers/:id                 → Transfer detail
PATCH  /api/v1/transfers/:id/status          → Update transfer status
```

---

*End of Phase 6 — API Design*
