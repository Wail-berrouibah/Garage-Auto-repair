# Mechanica — Garage & Auto Repair Management Platform

Mechanica is an enterprise-grade, full-stack web application that digitizes garage and auto repair workshop operations — from customer check-in and work order management to invoicing, inventory tracking, multi-branch consolidation, and reporting.

Built with **NestJS** and **Next.js**, it follows Domain-Driven Design (DDD) with modular architecture, ready to scale from a single shop to 50+ branch chains.

---

## Features

- **Work Order Management** — Full lifecycle tracking: OPEN → DIAGNOSED → WAITING_PARTS → IN_PROGRESS → QUALITY_CHECK → COMPLETED → DELIVERED. Mechanic assignment, labor/parts line items, time tracking, notes, and status history.
- **Customer & Vehicle Management** — Customer profiles, vehicle associations (1:N), VIN decoding, and photo upload.
- **Inventory Management** — SKU catalog, bin tracking, stock transactions, batch/serial tracking, reorder automation, low stock alerts, and branch-to-branch transfers.
- **Purchasing** — Supplier management, purchase orders with status tracking (DRAFT → SHIPPED → RECEIVED), goods receipt matching, and returns workflow.
- **Invoicing & Payments** — Auto-generation from work orders, multi-bracket tax, discounts, credit notes, PDF generation, partial payments, and refund processing.
- **Quality Control** — Inspection checklist templates, QC sign-off, pass/fail results, and delivery blocking rules.
- **Multi-Branch** — Data isolation, cross-branch inventory transfers, consolidated reporting, and branch-level settings.
- **IAM & RBAC** — JWT authentication with refresh tokens, 6 roles (Owner, Manager, Receptionist, Mechanic, Accountant, Inventory Manager), and branch-scoped permissions.
- **Reports & Dashboard** — Financial P&L, workshop KPIs, mechanic utilization, inventory valuation, and export to CSV/Excel/PDF.
- **Audit Log** — Immutable, hash-chained audit trail for all entity changes.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| [NestJS](https://nestjs.com/) 11 | Backend framework |
| [TypeScript](https://www.typescriptlang.org/) 5.7 | Language |
| [PostgreSQL](https://www.postgresql.org/) 15 | Primary database |
| [Prisma](https://www.prisma.io/) 6 | ORM & migrations |
| [Redis](https://redis.io/) | Caching & BullMQ job queue |
| [BullMQ](https://docs.bullmq.io/) | Background job processing |
| [Swagger](https://swagger.io/) / OpenAPI | API documentation |
| [Passport](https://www.passportjs.org/) + JWT | Authentication |

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) 16 | React framework (App Router) |
| [React](https://react.dev/) 19 | UI library |
| [TypeScript](https://www.typescriptlang.org/) 5 | Language |
| [TailwindCSS](https://tailwindcss.com/) v4 | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library (Radix primitives) |
| [TanStack React Query](https://tanstack.com/query) | Server state & caching |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |

### Infrastructure
- **Containerization**: Docker / ECS Fargate
- **Database**: AWS RDS (PostgreSQL)
- **Cache**: ElastiCache (Redis)
- **Storage**: AWS S3 / MinIO
- **CI/CD**: GitHub Actions
- **IaC**: Terraform

---

## Project Structure

```
├── backend/                  # NestJS API server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (30 models)
│   │   └── seed.ts           # Database seeder
│   ├── src/
│   │   ├── main.ts           # App bootstrap
│   │   ├── common/           # Guards, decorators, filters, interceptors
│   │   ├── modules/          # 18 domain modules (auth, work-orders, inventory, ...)
│   │   └── shared/           # Prisma, Redis, S3, Email, BullMQ services
│   ├── test/                 # E2E tests
│   └── .env.example
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # UI components & layout
│   │   ├── lib/              # API client & utilities
│   │   ├── stores/           # Zustand stores
│   │   └── types/            # TypeScript types
│   └── public/
├── docs/                     # 14 comprehensive design documents
├── infrastructure/           # Terraform, ECS, NGINX configs
└── scripts/                  # Utility scripts
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Redis
- npm or yarn

### Backend Setup

```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database, Redis, and JWT secrets

# Run database migrations and seed
npx prisma migrate dev
npx prisma db seed

# Start development server
npm run start:dev
```

API documentation is available at `http://localhost:3000/api/docs` once the server is running.

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3001`.

### Environment Variables

Key environment variables (`backend/.env`):

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets |
| `JWT_ACCESS_EXPIRY` | Access token TTL (default: 15m) |
| `JWT_REFRESH_EXPIRY` | Refresh token TTL (default: 7d) |
| `AWS_S3_*` | S3-compatible storage config |
| `SMTP_*` | Email server config |

---

## Available Scripts

### Backend

| Script | Description |
|---|---|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Start production build |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run lint` | Lint and auto-fix |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:migrate` | Run dev migrations |
| `npm run prisma:seed` | Seed database |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Architecture

Mechanica follows a **Modular Monolith** architecture designed with microservice-ready boundaries:

- **Domain-Driven Design**: 15 bounded contexts mapped to NestJS modules
- **CQRS**: Command/Query separation via `@nestjs/cqrs`
- **Event-Driven**: BullMQ for inter-module communication and background jobs
- **RESTful API**: Global `api/v1` prefix, standardized response envelope `{ data, meta }`, OpenAPI documentation
- **Database**: 30 Prisma models with full relational schema, enums, and indexing strategy

Bounded contexts can be extracted to standalone microservices without rewrites thanks to event-driven communication.

---

## API Documentation

Swagger/OpenAPI documentation is auto-generated and available at `/api/docs` when the backend is running.

The API follows a consistent pattern:

```
GET    /api/v1/{resource}       # List (paginated)
POST   /api/v1/{resource}       # Create
GET    /api/v1/{resource}/:id   # Get by ID
PATCH  /api/v1/{resource}/:id   # Update
DELETE /api/v1/{resource}/:id   # Soft delete
```

---

## License

This project is licensed under the MIT License.
