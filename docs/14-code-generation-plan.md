# Phase 14 — Code Generation Plan

## Platform: Mechanica
## Document Version: 1.0

---

# 14.1 Folder Structure

```
/mechanica/
├── backend/
│   ├── src/
│   │   ├── main.ts                          # Entry point
│   │   ├── app.module.ts                    # Root module
│   │   ├── config/
│   │   │   ├── app.config.ts                # App configuration
│   │   │   ├── database.config.ts           # Prisma + DB config
│   │   │   ├── redis.config.ts             # Redis + BullMQ config
│   │   │   ├── jwt.config.ts               # JWT configuration
│   │   │   └── aws.config.ts               # AWS SDK config
│   │   ├── common/
│   │   │   ├── constants/
│   │   │   │   ├── status-codes.ts          # WO status, PO status, Invoice status enums
│   │   │   │   ├── error-codes.ts          # Application error codes
│   │   │   │   └── permissions.ts          # Permission constants
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   ├── permissions.decorator.ts
│   │   │   │   └── branch-scope.decorator.ts
│   │   │   ├── dto/
│   │   │   │   ├── pagination.dto.ts        # PaginationQueryDto
│   │   │   │   ├── filter.dto.ts           # FilterDto
│   │   │   │   └── api-response.dto.ts     # ApiResponse, ApiPaginatedResponse
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   ├── permissions.guard.ts
│   │   │   │   └── branch.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   ├── transform.interceptor.ts  # Response envelope
│   │   │   │   └── audit.interceptor.ts
│   │   │   ├── pipes/
│   │   │   │   ├── validation.pipe.ts
│   │   │   │   └── parse-uuid.pipe.ts
│   │   │   ├── filters/
│   │   │   │   ├── http-exception.filter.ts
│   │   │   │   └── domain-exception.filter.ts
│   │   │   ├── middleware/
│   │   │   │   ├── request-id.middleware.ts
│   │   │   │   └── branch-context.middleware.ts
│   │   │   └── types/
│   │   │       ├── user-context.type.ts     # Authenticated user type
│   │   │       └── pagination.type.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   │   └── reset-password.dto.ts
│   │   │   │   └── auth.guard.ts
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-user.dto.ts
│   │   │   │   │   ├── update-user.dto.ts
│   │   │   │   │   └── user-response.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   └── tests/
│   │   │   │       ├── users.service.spec.ts
│   │   │   │       └── users.controller.spec.ts
│   │   │   ├── roles/
│   │   │   │   ├── roles.module.ts
│   │   │   │   ├── roles.controller.ts
│   │   │   │   ├── roles.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-role.dto.ts
│   │   │   │   │   └── role-response.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── role.entity.ts
│   │   │   ├── customers/
│   │   │   │   ├── customers.module.ts
│   │   │   │   ├── customers.controller.ts
│   │   │   │   ├── customers.service.ts
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-customer.command.ts
│   │   │   │   │   ├── update-customer.command.ts
│   │   │   │   │   ├── delete-customer.command.ts
│   │   │   │   │   └── handlers/
│   │   │   │   │       ├── create-customer.handler.ts
│   │   │   │   │       ├── update-customer.handler.ts
│   │   │   │   │       └── delete-customer.handler.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-customer.query.ts
│   │   │   │   │   ├── list-customers.query.ts
│   │   │   │   │   └── handlers/
│   │   │   │   │       ├── get-customer.handler.ts
│   │   │   │   │       └── list-customers.handler.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-customer.dto.ts
│   │   │   │   │   ├── update-customer.dto.ts
│   │   │   │   │   └── customer-response.dto.ts
│   │   │   │   ├── domain/
│   │   │   │   │   ├── customer.entity.ts
│   │   │   │   │   ├── contact-info.value-object.ts
│   │   │   │   │   └── events/
│   │   │   │   │       ├── customer-created.event.ts
│   │   │   │   │       └── customer-updated.event.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── customer.repository.ts          # Interface
│   │   │   │   │   └── prisma-customer.repository.ts   # Implementation
│   │   │   │   └── tests/
│   │   │   ├── vehicles/
│   │   │   │   ├── vehicles.module.ts
│   │   │   │   ├── vehicles.controller.ts
│   │   │   │   ├── vehicles.service.ts
│   │   │   │   ├── commands/...
│   │   │   │   ├── queries/...
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-vehicle.dto.ts
│   │   │   │   │   ├── update-vehicle.dto.ts
│   │   │   │   │   ├── vehicle-response.dto.ts
│   │   │   │   │   └── decode-vin.dto.ts
│   │   │   │   ├── domain/
│   │   │   │   │   ├── vehicle.entity.ts
│   │   │   │   │   ├── vin-info.value-object.ts
│   │   │   │   │   └── events/
│   │   │   │   │       └── vehicle-registered.event.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── vin-decoder.service.ts          # NHTSA API
│   │   │   │   │   └── vin-decoder.interface.ts
│   │   │   │   ├── repositories/...
│   │   │   │   └── tests/...
│   │   │   ├── work-orders/
│   │   │   │   ├── work-orders.module.ts
│   │   │   │   ├── work-orders.controller.ts
│   │   │   │   ├── work-orders.service.ts
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-work-order.command.ts
│   │   │   │   │   ├── update-work-order.command.ts
│   │   │   │   │   ├── change-status.command.ts
│   │   │   │   │   ├── assign-mechanic.command.ts
│   │   │   │   │   ├── add-labor.command.ts
│   │   │   │   │   ├── add-part.command.ts
│   │   │   │   │   ├── clock-in-out.command.ts
│   │   │   │   │   ├── add-note.command.ts
│   │   │   │   │   └── handlers/...
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-work-order.query.ts
│   │   │   │   │   ├── list-work-orders.query.ts
│   │   │   │   │   ├── get-kanban-board.query.ts
│   │   │   │   │   └── handlers/...
│   │   │   │   ├── dto/...
│   │   │   │   ├── domain/
│   │   │   │   │   ├── work-order.entity.ts
│   │   │   │   │   ├── labor-entry.entity.ts
│   │   │   │   │   ├── part-entry.entity.ts
│   │   │   │   │   ├── time-entry.entity.ts
│   │   │   │   │   ├── work-note.entity.ts
│   │   │   │   │   ├── wo-status.value-object.ts
│   │   │   │   │   ├── status-machine.ts             # State machine
│   │   │   │   │   └── events/
│   │   │   │   │       ├── work-order-created.event.ts
│   │   │   │   │       ├── status-changed.event.ts
│   │   │   │   │       ├── mechanic-assigned.event.ts
│   │   │   │   │       ├── time-entry-started.event.ts
│   │   │   │   │       └── time-entry-completed.event.ts
│   │   │   │   ├── services/
│   │   │   │   │   └── time-tracker.service.ts
│   │   │   │   ├── repositories/...
│   │   │   │   └── tests/...
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.module.ts
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.service.ts
│   │   │   │   ├── commands/...
│   │   │   │   ├── queries/...
│   │   │   │   ├── dto/...
│   │   │   │   ├── domain/
│   │   │   │   │   ├── stock-item.entity.ts
│   │   │   │   │   ├── stock-batch.entity.ts
│   │   │   │   │   ├── warehouse.entity.ts
│   │   │   │   │   ├── stock-movement.entity.ts
│   │   │   │   │   ├── events/
│   │   │   │   │   │   ├── stock-level-low.event.ts
│   │   │   │   │   │   └── stock-adjusted.event.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── inventory-valuation.service.ts
│   │   │   │   │   └── reorder.service.ts
│   │   │   │   ├── repositories/...
│   │   │   │   └── tests/...
│   │   │   ├── purchasing/
│   │   │   ├── invoicing/
│   │   │   ├── payments/
│   │   │   ├── quality-control/
│   │   │   ├── services-catalog/
│   │   │   ├── notifications/
│   │   │   ├── documents/
│   │   │   ├── audit-log/
│   │   │   ├── reports/
│   │   │   ├── dashboard/
│   │   │   └── multi-branch/
│   │   │       ├── branches/
│   │   │       └── transfers/
│   │   └── shared/
│   │       ├── prisma/
│   │       │   ├── prisma.module.ts
│   │       │   └── prisma.service.ts
│   │       ├── redis/
│   │       │   ├── redis.module.ts
│   │       │   └── redis.service.ts
│   │       ├── bull/
│   │       │   ├── bull.module.ts
│   │       │   └── bull.service.ts
│   │       ├── s3/
│   │       │   ├── s3.module.ts
│   │       │   └── s3.service.ts
│   │       ├── email/
│   │       │   ├── email.module.ts
│   │       │   └── email.service.ts
│   │       └── logger/
│   │           ├── logger.module.ts
│   │           └── logger.service.ts
│   ├── prisma/
│   │   ├── schema.prisma                       # Full Prisma schema
│   │   ├── migrations/                         # Auto-generated
│   │   └── seed.ts                             # Seed data
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                    # Root layout
│   │   │   ├── page.tsx                      # Redirect to /app
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── app/
│   │   │       ├── layout.tsx                 # Authenticated layout
│   │   │       ├── page.tsx                   # Dashboard
│   │   │       ├── work-orders/
│   │   │       │   ├── page.tsx               # Kanban board
│   │   │       │   ├── [id]/page.tsx          # WO detail
│   │   │       │   └── new/page.tsx           # Create WO
│   │   │       ├── vehicles/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [id]/page.tsx
│   │   │       │   └── new/page.tsx
│   │   │       ├── customers/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── [id]/page.tsx
│   │   │       │   └── new/page.tsx
│   │   │       ├── inventory/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── items/[id]/page.tsx
│   │   │       │   ├── warehouses/page.tsx
│   │   │       │   └── movements/page.tsx
│   │   │       ├── purchasing/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── purchase-orders/
│   │   │       │   │   ├── page.tsx
│   │   │       │   │   ├── [id]/page.tsx
│   │   │       │   │   └── new/page.tsx
│   │   │       │   └── suppliers/
│   │   │       │       ├── page.tsx
│   │   │       │       └── new/page.tsx
│   │   │       ├── services/
│   │   │       │   └── page.tsx
│   │   │       ├── invoices/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── payments/
│   │   │       │   └── page.tsx
│   │   │       ├── qc/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── templates/
│   │   │       │   │   ├── page.tsx
│   │   │       │   │   └── [id]/page.tsx
│   │   │       │   └── inspections/[id]/page.tsx
│   │   │       ├── reports/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── financial/page.tsx
│   │   │       │   ├── workshop/page.tsx
│   │   │       │   ├── mechanics/page.tsx
│   │   │       │   └── inventory/page.tsx
│   │   │       ├── mechanics/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       └── settings/
│   │   │           ├── page.tsx
│   │   │           ├── users/
│   │   │           │   ├── page.tsx
│   │   │           │   └── [id]/page.tsx
│   │   │           ├── roles/page.tsx
│   │   │           ├── branches/
│   │   │           │   ├── page.tsx
│   │   │           │   └── [id]/page.tsx
│   │   │           └── general/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                             # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   ├── main-content.tsx
│   │   │   │   └── mobile-nav.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── kpi-card.tsx
│   │   │   │   ├── kpi-card-grid.tsx
│   │   │   │   ├── revenue-chart.tsx
│   │   │   │   ├── wo-status-chart.tsx
│   │   │   │   ├── activity-feed.tsx
│   │   │   │   └── quick-actions.tsx
│   │   │   ├── work-orders/
│   │   │   │   ├── kanban-board.tsx
│   │   │   │   ├── kanban-column.tsx
│   │   │   │   ├── wo-card.tsx
│   │   │   │   ├── wo-detail.tsx
│   │   │   │   ├── labor-section.tsx
│   │   │   │   ├── parts-section.tsx
│   │   │   │   ├── time-tracking.tsx
│   │   │   │   ├── notes-section.tsx
│   │   │   │   └── status-timeline.tsx
│   │   │   ├── customers/
│   │   │   │   ├── customer-table.tsx
│   │   │   │   ├── customer-form.tsx
│   │   │   │   └── customer-detail.tsx
│   │   │   ├── vehicles/
│   │   │   │   ├── vehicle-table.tsx
│   │   │   │   ├── vehicle-form.tsx
│   │   │   │   ├── vin-decode.tsx
│   │   │   │   └── vehicle-history-timeline.tsx
│   │   │   ├── inventory/
│   │   │   │   ├── stock-item-table.tsx
│   │   │   │   ├── stock-item-detail.tsx
│   │   │   │   ├── low-stock-alerts.tsx
│   │   │   │   └── warehouse-list.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── invoice-table.tsx
│   │   │   │   ├── invoice-detail.tsx
│   │   │   │   ├── invoice-form.tsx
│   │   │   │   └── payment-form.tsx
│   │   │   ├── qc/
│   │   │   │   ├── qc-inspection.tsx
│   │   │   │   ├── qc-checklist.tsx
│   │   │   │   └── blocked-deliveries.tsx
│   │   │   ├── settings/
│   │   │   │   ├── user-table.tsx
│   │   │   │   ├── user-form.tsx
│   │   │   │   ├── permission-matrix.tsx
│   │   │   │   └── branch-card.tsx
│   │   │   └── shared/
│   │   │       ├── data-table.tsx
│   │   │       ├── page-header.tsx
│   │   │       ├── search-input.tsx
│   │   │       ├── confirm-dialog.tsx
│   │   │       ├── empty-state.tsx
│   │   │       ├── error-boundary.tsx
│   │   │       ├── loading-spinner.tsx
│   │   │       └── branch-guard.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   ├── use-branch.ts
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-work-orders.ts           # React Query hooks
│   │   │   ├── use-customers.ts
│   │   │   ├── use-vehicles.ts
│   │   │   ├── use-inventory.ts
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api-client.ts                # Axios instance
│   │   │   ├── query-keys.ts                # React Query key constants
│   │   │   ├── utils.ts                     # cn() and other helpers
│   │   │   └── constants.ts                 # Enums, status colors
│   │   ├── stores/
│   │   │   ├── auth-store.ts                # Zustand: user, tokens
│   │   │   ├── branch-store.ts             # Zustand: selected branch
│   │   │   ├── theme-store.ts              # Zustand: dark/light
│   │   │   ├── notification-store.ts       # Zustand: notifications
│   │   │   └── ui-store.ts                 # Zustand: modals, sidebar
│   │   ├── types/
│   │   │   ├── api.ts                      # API response types
│   │   │   ├── auth.ts
│   │   │   ├── work-order.ts
│   │   │   ├── customer.ts
│   │   │   ├── vehicle.ts
│   │   │   ├── inventory.ts
│   │   │   ├── invoice.ts
│   │   │   └── ...
│   │   └── schemas/
│   │       ├── auth.schema.ts              # Zod schemas
│   │       ├── customer.schema.ts
│   │       ├── vehicle.schema.ts
│   │       ├── work-order.schema.ts
│   │       └── ...
│   ├── public/
│   │   ├── logo.svg
│   │   └── favicon.ico
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── infrastructure/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── sites/
│   │       └── mechanica.conf
│   ├── ecs/
│   │   ├── task-definition-api.json
│   │   ├── task-definition-worker.json
│   │   └── task-definition-frontend.json
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── modules/
│   │   │   ├── networking/
│   │   │   ├── compute/
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   └── storage/
│   │   └── environments/
│   │       ├── dev.tfvars
│   │       ├── staging.tfvars
│   │       └── prod.tfvars
│   └── monitoring/
│       ├── cloudwatch-dashboard.json
│       └── alerts.json
│
├── scripts/
│   ├── setup.sh                            # Initial setup
│   ├── seed.sh                             # Database seeding
│   ├── backup.sh                           # Manual backup
│   └── restore.sh                          # Manual restore
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── .gitignore
├── .eslintrc.js                            # Backend + Frontend shared rules
├── .prettierrc
├── AGENTS.md                               # LLM context file
├── README.md
└── package.json                            # Root workspace (optional)
```

---

# 14.2 Module Template (Backend)

Every module follows this structure using Clean Architecture + CQRS:

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts                  # Optional facade
├── commands/
│   ├── create-item.command.ts
│   ├── update-item.command.ts
│   ├── delete-item.command.ts
│   └── handlers/
│       ├── create-item.handler.ts
│       ├── update-item.handler.ts
│       └── delete-item.handler.ts
├── queries/
│   ├── get-item.query.ts
│   ├── list-items.query.ts
│   └── handlers/
│       ├── get-item.handler.ts
│       └── list-items.handler.ts
├── dto/
│   ├── create-item.dto.ts
│   ├── update-item.dto.ts
│   └── item-response.dto.ts
├── domain/
│   ├── item.entity.ts
│   ├── value-objects/
│   └── events/
│       ├── item-created.event.ts
│       └── item-updated.event.ts
├── repositories/
│   ├── item.repository.ts                  # Interface
│   └── prisma-item.repository.ts           # Impl
├── services/                                # Domain services
│   └── some-domain-service.ts
├── subscribers/                             # Event subscribers
│   └── item.subscriber.ts
└── tests/
    ├── commands/
    ├── queries/
    ├── services/
    └── controllers/
```

---

# 14.3 Component Template (Frontend)

```
components/
└── feature-name/
    ├── feature-table.tsx                    # List view
    ├── feature-form.tsx                     # Create/Edit form
    ├── feature-detail.tsx                   # Detail view
    ├── feature-card.tsx                     # Card variant
    └── feature-actions.tsx                  # Action buttons/dropdown
```

---

# 14.4 Coding Standards

## TypeScript

| Rule | Standard |
|------|----------|
| Naming | camelCase for variables/functions, PascalCase for classes/types/interfaces |
| Files | kebab-case for files, PascalCase for class/component files |
| Imports | Organized: external → internal (grouped by module) |
| Types | Strict mode enabled, `any` prohibited (use `unknown` if needed) |
| Null/Undefined | Prefer `undefined` over `null` for missing values |
| Async | Always use async/await over raw promises |
| Error handling | Custom exception classes, never `throw new Error` in domain layer |
| Enums | Use `const enum` for TypeScript, database-backed for roles/permissions |
| Functions | Max 30 lines per function, max 3 parameters (use object params) |
| Classes | Single responsibility, max 200 lines per class |

## Backend (NestJS)

| Rule | Standard |
|------|----------|
| Module naming | `*.module.ts` |
| Controller naming | `*.controller.ts` |
| Service naming | `*.service.ts` |
| DTO naming | `{action}-{entity}.dto.ts` |
| Guard naming | `*.guard.ts` |
| Decorator naming | `*.decorator.ts` |
| Validation | `class-validator` + `class-transformer` for DTOs |
| Swagger | `@ApiTags`, `@ApiOperation`, `@ApiResponse` on all endpoints |

## Frontend (Next.js)

| Rule | Standard |
|------|----------|
| Components | Server components by default, 'use client' only when needed |
| File naming | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` |
| Styles | TailwindCSS classes, shadcn/ui variants |
| Forms | React Hook Form + Zod resolver |
| State | Zustand for client state, React Query for server state |
| Data fetching | React Query hooks in `hooks/` directory |
| Types | Zod inference for API types: `z.infer<typeof schema>` |

---

# 14.5 Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Database tables | snake_case, plural | `work_orders`, `stock_items` |
| Database columns | snake_case | `first_name`, `created_at` |
| Prisma models | PascalCase, singular | `WorkOrder`, `StockItem` |
| TypeScript interfaces | PascalCase with `I` prefix (optional) | `IWorkOrderRepository` |
| TypeScript types | PascalCase | `WOStatus`, `PaginatedResult<T>` |
| DTO classes | PascalCase | `CreateWorkOrderDto` |
| DTO files | kebab-case | `create-work-order.dto.ts` |
| Commands | PascalCase | `CreateWorkOrderCommand` |
| Queries | PascalCase with suffix | `GetWorkOrderQuery` |
| Events | PascalCase | `WorkOrderCreatedEvent` |
| Handlers | PascalCase with suffix | `CreateWorkOrderHandler` |
| NestJS modules | PascalCase | `WorkOrdersModule` |
| Controllers | PascalCase | `WorkOrdersController` |
| React components | PascalCase | `KanbanBoard`, `WoCard` |
| React hooks | camelCase with `use` prefix | `useWorkOrders` |
| Zustand stores | camelCase with `Store` suffix | `useAuthStore` |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Constants | UPPER_SNAKE_CASE | `WO_OPEN`, `WO_IN_PROGRESS` |
| File names | kebab-case | `work-order-card.tsx`, `auth-store.ts` |

---

# 14.6 Module Generation Order (Iterative)

Based on user preference for iterative per-module code generation:

| Order | Module | Dependencies | Est. Files |
|-------|--------|--------------|------------|
| 1 | **Auth/IAM** | Prisma schema, shared guards | ~30 files |
| 2 | **Customers** | Auth | ~20 files |
| 3 | **Vehicles** | Customers, VIN API | ~20 files |
| 4 | **Work Orders** | Customers, Vehicles, Services | ~50 files |
| 5 | **Labor & Services** | Auth | ~15 files |
| 6 | **Inventory** | Multi-Branch | ~35 files |
| 7 | **Purchasing** | Inventory, Suppliers | ~30 files |
| 8 | **Invoicing** | Work Orders, Services, Inventory | ~40 files |
| 9 | **Payments** | Invoicing | ~25 files |
| 10 | **Quality Control** | Work Orders | ~25 files |
| 11 | **Dashboard** | All modules | ~20 files |
| 12 | **Reports** | All modules | ~15 files |
| 13 | **Notifications** | All modules | ~15 files |
| 14 | **Documents** | S3, Work Orders, Vehicles | ~15 files |
| 15 | **Audit Log** | All modules (Prisma middleware) | ~10 files |
| 16 | **Multi-Branch** | Inventory | ~20 files |

## Total Estimated Files (Full Code Generation)

| Category | Files |
|----------|-------|
| Backend modules (16) | ~385 |
| Backend shared | ~30 |
| Backend tests | ~200 |
| Prisma | 3 |
| Frontend pages | ~40 |
| Frontend components | ~80 |
| Frontend hooks/stores/types | ~50 |
| Frontend tests | ~50 |
| Infrastructure | ~20 |
| CI/CD + Config | ~15 |
| **Total** | **~873 files** |

---

# 14.7 First Module Generation Structure (Auth/IAM)

When we begin iterative code generation, the Auth/IAM module will be first:

```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── auth-response.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
└── tests/
    ├── auth.service.spec.ts
    └── auth.controller.spec.ts

backend/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── commands/
│   ├── create-user.command.ts
│   ├── update-user.command.ts
│   ├── lock-user.command.ts
│   ├── unlock-user.command.ts
│   └── handlers/
│       ├── create-user.handler.ts
│       ├── update-user.handler.ts
│       ├── lock-user.handler.ts
│       └── unlock-user.handler.ts
├── queries/
│   ├── get-user.query.ts
│   ├── list-users.query.ts
│   └── handlers/
│       ├── get-user.handler.ts
│       └── list-users.handler.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── domain/
│   ├── user.entity.ts
│   └── events/
│       └── user-created.event.ts
├── repositories/
│   ├── user.repository.ts
│   └── prisma-user.repository.ts
└── tests/
    ├── commands/
    ├── queries/
    └── services/
```

---

# 14.8 Prisma Schema (First Segment — Auth)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RoleName {
  OWNER
  MANAGER
  RECEPTIONIST
  MECHANIC
  ACCOUNTANT
  INVENTORY_MANAGER
}

enum PermissionAction {
  CREATE
  READ
  UPDATE
  DELETE
  APPROVE
  EXPORT
  MANAGE
}

enum PermissionScope {
  GLOBAL
  BRANCH
  SELF
}

model Branch {
  id        String   @id @default(uuid()) @db.Uuid
  code      String   @unique @db.VarChar(10)
  name      String   @db.VarChar(255)
  // ... full schema as defined in Phase 4

  users     UserBranchAssignment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}

model User {
  id              String   @id @default(uuid()) @db.Uuid
  email           String   @unique @db.VarChar(255)
  passwordHash    String   @db.VarChar(255)
  firstName       String   @map("first_name") @db.VarChar(100)
  lastName        String   @map("last_name") @db.VarChar(100)
  phone           String?  @db.VarChar(30)
  isActive        Boolean  @default(true) @map("is_active")
  isLocked        Boolean  @default(false) @map("is_locked")
  failedAttempts  Int      @default(0) @map("failed_attempts")
  lastLoginAt     DateTime? @map("last_login_at")
  passwordChangedAt DateTime @default(now()) @map("password_changed_at")
  refreshToken    String?  @map("refresh_token")
  preferences     Json     @default("{\"theme\":\"light\",\"locale\":\"en\",\"timezone\":\"UTC\"}")

  roles           UserRole[]
  branchAssignments UserBranchAssignment[]
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  @@map("users")
}

model Role {
  id          String         @id @default(uuid()) @db.Uuid
  name        RoleName       @unique
  description String?        @db.VarChar(255)
  isSystem    Boolean        @default(false) @map("is_system")
  users       UserRole[]
  permissions Permission[]
  createdAt   DateTime       @default(now()) @map("created_at")

  @@map("roles")
}

model UserRole {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  roleId    String   @map("role_id") @db.Uuid
  branchId  String?  @map("branch_id") @db.Uuid
  grantedAt DateTime @default(now()) @map("granted_at")
  grantedBy String?  @map("granted_by") @db.Uuid

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  branch    Branch?  @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId, branchId])
  @@map("user_roles")
}

model Permission {
  id       String           @id @default(uuid()) @db.Uuid
  roleId   String           @map("role_id") @db.Uuid
  resource String           @db.VarChar(100)
  action   PermissionAction
  scope    PermissionScope  @default(BRANCH)

  role     Role             @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, resource, action])
  @@map("permissions")
}

model UserBranchAssignment {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  branchId  String   @map("branch_id") @db.Uuid
  isPrimary Boolean  @default(false) @map("is_primary")
  assignedAt DateTime @default(now()) @map("assigned_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([userId, branchId])
  @@map("user_branch_assignments")
}
```

---

*End of Phase 14 — Code Generation Plan*
