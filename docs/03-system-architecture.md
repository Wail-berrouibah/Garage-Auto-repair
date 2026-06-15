# Phase 3 — System Architecture

## Platform: Mechanica
## Document Version: 1.0

---

# 3.1 Architecture Philosophy

## Architectural Style: Modular Monolith with Microservice-Ready Boundaries

**Decision:** Start as a modular monolith with strict bounded context boundaries, deployable as microservices in the future.

**Rationale:**
- A startup/single-team environment benefits from monolithic deployment simplicity
- DDD bounded contexts provide natural microservice boundaries
- Event-driven communication between modules means extraction to microservices requires no rewrites
- CQRS pattern supports independent scaling of reads vs writes
- Reduces initial DevOps complexity while preserving architectural integrity

**Architecture Patterns Used:**
- Clean Architecture (layered: Presentation → Application → Domain → Infrastructure)
- CQRS (Command Query Responsibility Segregation)
- Event-Driven Architecture (domain events via message bus)
- Repository Pattern (data access abstraction)
- Unit of Work (transaction management across aggregates)
- Saga Pattern (long-running business processes)

---

# 3.2 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MECHANICA — HIGH-LEVEL ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Next.js 15   │    │  Next.js 15   │    │  Mobile      │              │
│  │  (Desktop)    │    │  (Tablet)     │    │  Browser     │              │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘              │
│         │                    │                    │                       │
│         └────────────────────┼────────────────────┘                      │
│                              │ HTTPS                                     │
│                              ▼                                           │
│  ┌─────────────────────────────────────────────┐                        │
│  │           NGINX / AWS CloudFront             │                        │
│  │         (Reverse Proxy / CDN / SSL)          │                        │
│  └──────────────────┬──────────────────────────┘                        │
│                     │                                                    │
│                     ▼                                                    │
│  ┌─────────────────────────────────────────────┐                        │
│  │         NESTJS APPLICATION (Node.js)         │                        │
│  │                                              │                        │
│  │  ┌──────────────────────────────────────┐   │                        │
│  │  │         API GATEWAY LAYER             │   │                        │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │   │                        │
│  │  │  │Auth  │ │Rate  │ │Valid │ │Log   │ │   │                        │
│  │  │  │Guard │ │Limit │ │ation │ │ging  │ │   │                        │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ │   │                        │
│  │  └──────────────────────────────────────┘   │                        │
│  │                                              │                        │
│  │  ┌──────────────────────────────────────┐   │                        │
│  │  │         MODULE LAYER                  │   │                        │
│  │  │  ┌────────┐┌────────┐┌─────────────┐│   │                        │
│  │  │  │Customer││Vehicle ││  WorkOrder   ││   │                        │
│  │  │  │Module  ││Module  ││   Module     ││   │                        │
│  │  │  ├────────┤├────────┤├─────────────┤│   │                        │
│  │  │  │Inventory││Purchase││  Invoicing   ││   │                        │
│  │  │  │Module  ││Module  ││   Module     ││   │                        │
│  │  │  ├────────┤├────────┤├─────────────┤│   │                        │
│  │  │  │Payments││QC      ││  Reports     ││   │                        │
│  │  │  │Module  ││Module  ││   Module     ││   │                        │
│  │  │  ├────────┤├────────┤├─────────────┤│   │                        │
│  │  │  │Notifs  ││Docs    ││  Audit       ││   │                        │
│  │  │  │Module  ││Module  ││   Module     ││   │                        │
│  │  │  └────────┘└────────┘└─────────────┘│   │                        │
│  │  └──────────────────────────────────────┘   │                        │
│  │                                              │                        │
│  │  ┌──────────────────────────────────────┐   │                        │
│  │  │         CQRS LAYER                    │   │                        │
│  │  │  ┌──────────────────┐ ┌────────────┐  │   │                        │
│  │  │  │  COMMAND BUS      │ │  QUERY BUS │  │   │                        │
│  │  │  │  (Write Path)     │ │  (Read Path)│  │   │                        │
│  │  │  └──────────────────┘ └────────────┘  │   │                        │
│  │  └──────────────────────────────────────┘   │                        │
│  │                                              │                        │
│  │  ┌──────────────────────────────────────┐   │                        │
│  │  │         EVENT BUS                     │   │                        │
│  │  │  (NestJS EventEmitter / BullMQ)       │   │                        │
│  │  └──────────────────────────────────────┘   │                        │
│  │                                              │                        │
│  │  ┌──────────────────────────────────────┐   │                        │
│  │  │         INFRASTRUCTURE LAYER          │   │                        │
│  │  │  ┌────────┐┌────────┐┌────────────┐  │   │                        │
│  │  │  │Prisma  ││Redis   ││  S3 SDK    │  │   │                        │
│  │  │  │(Post)  ││(Cache) ││  (Storage) │  │   │                        │
│  │  │  └────────┘└────────┘└────────────┘  │   │                        │
│  │  └──────────────────────────────────────┘   │                        │
│  └─────────────────────────────────────────────┘                        │
│                     │                                                    │
│        ┌────────────┼────────────┬─────────────────┐                    │
│        ▼            ▼            ▼                  ▼                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐           │
│  │PostgreSQL│ │  Redis   │ │  Redis   │ │  AWS S3 /        │           │
│  │(Primary) │ │ (Cache)  │ │ (Queue)  │ │  Compatible      │           │
│  │          │ │          │ │ (BullMQ) │ │  Storage          │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 3.3 Component Diagram (C4 — Container Level)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Person: Mechanic                              Person: Manager           │
│  [User]                                        [User]                    │
│       │                                              │                   │
│       └──────────────┬───────────────────────────────┘                   │
│                      │ HTTPS                                             │
│                      ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐                │
│  │  Single Page Application (Next.js 15)                 │                │
│  │  - React 19, TailwindCSS, shadcn/ui, React Query     │                │
│  │  - Zustand (client state), React Hook Form + Zod     │                │
│  │  - Dark/Light mode, Responsive, WCAG 2.1 AA          │                │
│  └────────────────────┬─────────────────────────────────┘                │
│                       │ REST API (JSON)                                  │
│                       ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐                │
│  │  NestJS API Server (Node.js, TypeScript)              │                │
│  │                                                       │                │
│  │  ┌──────────────────────────────────────────────┐    │                │
│  │  │  API Gateway / Guard Layer                    │    │                │
│  │  │  - JWT Auth Guard, RBAC Guard, Branch Guard  │    │                │
│  │  │  - Rate Limiting, Request Validation, Logging│    │                │
│  │  └──────────────────────────────────────────────┘    │                │
│  │                                                       │                │
│  │  ┌──────────────────────────────────────────────┐    │                │
│  │  │  Application Layer (Controllers + DTOs)       │    │                │
│  │  │  - REST endpoints                             │    │                │
│  │  │  - Request/Response validation (class-validator)│   │                │
│  │  │  - Swagger/OpenAPI decorators                 │    │                │
│  │  └──────────────────────────────────────────────┘    │                │
│  │                                                       │                │
│  │  ┌──────────────────────────────────────────────┐    │                │
│  │  │  Command / Query Handlers                     │    │                │
│  │  │  - CQRS pattern                               │    │                │
│  │  │  - @CommandHandler / @QueryHandler decorators │    │                │
│  │  └──────────────────────────────────────────────┘    │                │
│  │                                                       │                │
│  │  ┌──────────────────────────────────────────────┐    │                │
│  │  │  Domain Layer                                 │    │                │
│  │  │  - Entities, Value Objects, Domain Events    │    │                │
│  │  │  - Domain Services, Domain Logic              │    │                │
│  │  └──────────────────────────────────────────────┘    │                │
│  │                                                       │                │
│  │  ┌──────────────────────────────────────────────┐    │                │
│  │  │  Infrastructure Layer                         │    │                │
│  │  │  - PrismaService (PostgreSQL)                  │    │                │
│  │  │  - RedisService (Cache + Queue)               │    │                │
│  │  │  - S3Service (File Storage)                    │    │                │
│  │  │  - EmailService (SMTP/Nodemailer)              │    │                │
│  │  └──────────────────────────────────────────────┘    │                │
│  │                                                       │                │
│  └──────────────────────────────────────────────────────┘                │
│                       │                                                    │
│          ┌────────────┼────────────┬────────────────┐                    │
│          ▼            ▼            ▼                ▼                     │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐               │
│  │ PostgreSQL │ │  Redis   │ │  Redis   │ │  AWS S3 /    │               │
│  │ 15         │ │ Cache    │ │ BullMQ   │ │  MinIO       │               │
│  │            │ │ (Reads)  │ │ (Jobs)   │ │              │               │
│  └────────────┘ └──────────┘ └──────────┘ └──────────────┘               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# 3.4 Service Interaction Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │     │   API    │     │  Domain  │     │   Infra  │
│ (Next.js)│     │(NestJS)  │     │ (Module) │     │(Prisma)  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                 │                │                │
     │  POST /wo       │                │                │
     │────────────────▶│                │                │
     │                 │                │                │
     │                 │ CreateWOCommand│                │
     │                 │───────────────▶│                │
     │                 │                │                │
     │                 │                │ Validate VIN   │
     │                 │                │──── VehicleSvc │
     │                 │                │                │
     │                 │                │ Save WorkOrder │
     │                 │                │───────────────▶│
     │                 │                │                │
     │                 │                │◀───────────────│
     │                 │                │                │
     │                 │                │ Publish Event  │
     │                 │                │ WO.Created     │
     │                 │                │──▶ EventBus   │
     │                 │                │                │
     │                 │◀───────────────│                │
     │                 │                │                │
     │  WO Response    │                │                │
     │◀────────────────│                │                │
     │                 │                │                │
```

## Event Bus Interaction (BullMQ)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Publisher   │     │   BullMQ     │     │  Subscriber  │
│  (Module A)  │     │   Queue      │     │  (Module B)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  emit(event)       │                    │
       │───────────────────▶│                    │
       │                    │                    │
       │                    │  deliver(event)    │
       │                    │───────────────────▶│
       │                    │                    │
       │                    │                    │  handle(event)
       │                    │                    │──▶ Business Logic
       │                    │                    │
       │                    │  ack               │
       │                    │◀───────────────────│
       │                    │                    │
       │  completed         │                    │
       │◀───────────────────│                    │
       │                    │                    │
```

---

# 3.5 Deployment Diagram (AWS)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AWS CLOUD                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                       │
│  │  Route 53                                    │                       │
│  │  app.mechanica.com                           │                       │
│  └──────────────────┬───────────────────────────┘                       │
│                     │                                                   │
│  ┌──────────────────▼───────────────────────────┐                       │
│  │  CloudFront (CDN)                            │                       │
│  │  - Static assets (Next.js)                   │                       │
│  │  - API caching rules                         │                       │
│  │  - SSL termination                           │                       │
│  └──────────────────┬───────────────────────────┘                       │
│                     │                                                   │
│  ┌──────────────────▼───────────────────────────┐                       │
│  │  Application Load Balancer (ALB)              │                       │
│  │  - Target Group: NestJS ECS                  │                       │
│  │  - WAF integration                           │                       │
│  │  - Sticky sessions (disabled)                │                       │
│  └──────────────────┬───────────────────────────┘                       │
│                     │                                                   │
│  ┌──────────────────┴───────────────────────────┐                       │
│  │                                              │                       │
│  │  ┌──────────────────────────────────────┐   │                       │
│  │  │  ECS Fargate Cluster                  │   │                       │
│  │  │                                       │   │                       │
│  │  │  ┌──────────────┐ ┌──────────────┐   │   │                       │
│  │  │  │  NestJS API   │ │  NestJS API  │   │   │                       │
│  │  │  │  Service (x2) │ │  Service (x2)│   │   │                       │
│  │  │  └──────────────┘ └──────────────┘   │   │                       │
│  │  │                                       │   │                       │
│  │  │  ┌──────────────┐                     │   │                       │
│  │  │  │  BullMQ       │                     │   │                       │
│  │  │  │  Worker (x1)  │                     │   │                       │
│  │  │  └──────────────┘                     │   │                       │
│  │  └──────────────────────────────────────┘   │                       │
│  │                                              │                       │
│  └──────────────────┬───────────────────────────┘                       │
│                     │                                                   │
│  ┌──────────────────┴───────────────────────────┐                       │
│  │  RDS (PostgreSQL 15)                         │                       │
│  │  - Multi-AZ deployment                       │                       │
│  │  - Read replicas (for scaling)               │                       │
│  │  - Automated backups (15 min RPO)            │                       │
│  │  - Encryption at rest                        │                       │
│  └──────────────────────────────────────────────┘                       │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                       │
│  │  ElastiCache (Redis)                          │                       │
│  │  - Cluster mode disabled (v1)                │                       │
│  │  - Multi-AZ                                   │                       │
│  │  - Session cache, query cache, rate limiter   │                       │
│  └──────────────────────────────────────────────┘                       │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                       │
│  │  S3 Buckets                                   │                       │
│  │  - mechanica-documents (file uploads)          │                       │
│  │  - mechanica-backups (DB snapshots)            │                       │
│  │  - mechanica-logs (application logs)           │                       │
│  └──────────────────────────────────────────────┘                       │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                       │
│  │  Additional Services                          │                       │
│  │  - CloudWatch (logs, metrics, alarms)         │                       │
│  │  - SES (email sending)                        │                       │
│  │  - Secrets Manager (credentials)              │                       │
│  │  - WAF (web application firewall)             │                       │
│  └──────────────────────────────────────────────┘                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

# 3.6 Request Lifecycle

## Command Flow (Write Operation)

```
1. Client sends POST/PUT/DELETE request
       │
2. NGINX/CloudFront → SSL termination
       │
3. ALB → Route to healthy NestJS instance
       │
4. NestJS Global Guards:
   a. JwtAuthGuard → Validate access token from Authorization header
   b. RolesGuard → Verify user has required role
   c. BranchGuard → Verify user has access to requested branch
       │
5. NestJS Pipe → Validate request body (class-validator / Zod)
       │
6. Controller → Map request to Command object
       │
7. CommandBus → Dispatch Command to registered CommandHandler
       │
8. CommandHandler:
   a. Load aggregate from repository (Prisma)
   b. Execute domain logic (validate invariants)
   c. Apply changes to aggregate
   d. Save aggregate (Prisma transaction)
   e. Publish domain events
       │
9. EventBus (BullMQ):
   a. Events queued for async processing
   b. Subscribers handle side effects (notifications, audit, etc.)
       │
10. Controller returns Response DTO (201/200)
       │
11. Interceptor → Log request, format response envelope
```

## Query Flow (Read Operation)

```
1. Client sends GET request
       │
2-5. Same as Command (auth, authorization, validation)
       │
6. Controller → Map request to Query object
       │
7. QueryBus → Dispatch Query to registered QueryHandler
       │
8. QueryHandler:
   a. Check Redis cache for query result
   b. If cache hit → return cached data
   c. If cache miss → query database (Prisma)
   d. Cache result in Redis (TTL configurable)
   e. Return result
       │
9. Controller returns Response DTO (200)
```

## Event Flow (Domain Event Propagation)

```
1. Aggregate publishes DomainEvent after successful command
       │
2. EventBus (NestJS EventEmitter):
   a. Synchronous handlers (same process, same transaction)
   b. Example: Update read model
       │
3. EventBus (BullMQ):
   a. Asynchronous handlers (separate process, separate transaction)
   b. Enqueue event in BullMQ queue
   c. Worker picks up event
   d. Execute handler (e.g., send email, update search index)
   e. Acknowledge (ack) or retry on failure
       │
4. Each subscriber:
   a. AuditSubscriber → Log to audit table
   b. NotificationSubscriber → Create in-app notification
   c. ReportSubscriber → Update materialized view
   d. IntegrationSubscriber → Call external API (future)
```

---

# 3.7 Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modular Monolith | Single NestJS app with module boundaries | Simpler deployment, faster dev cycle, clear path to microservices |
| CQRS | NestJS CQRS package | Separates read/write concerns, independent optimization |
| Prisma ORM | Prisma | Type-safe queries, auto-generated types, migrations, great NestJS integration |
| BullMQ | BullMQ (Redis-backed) | Reliable job queue, delayed retries, rate limiting, observability |
| Redis Cache | ElastiCache Redis | Low-latency reads, session store, rate limiter backing store |
| S3 Storage | AWS S3 / MinIO | Durable, scalable, cost-effective file storage |
| Next.js SSR | Next.js 15 with React 19 | SEO-friendly, server components for dashboard, client components for interactivity |
| Zod + class-validator | Both | Zod for frontend validation, class-validator for NestJS DTOs (Swagger integration) |
| Zustand | Zustand | Lightweight client state management, no boilerplate |
| React Query | TanStack Query | Server state management, caching, optimistic updates |
| JWT + Refresh Tokens | JWT (access 15min, refresh 7 days) | Stateless auth with refresh rotation |
| RBAC | Database-backed roles/permissions | Flexible, auditable, configurable per branch |

---

*End of Phase 3 — System Architecture*
