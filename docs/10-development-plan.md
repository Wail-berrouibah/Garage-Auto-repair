# Phase 10 — Development Plan

## Platform: Mechanica
## Document Version: 1.0

---

# 10.1 Release Roadmap

```
Q1 2024              Q2 2024              Q3 2024              Q4 2024
──────────────────┼──────────────────┼──────────────────┼─────────────────
                                                           
███ MVP v1.0 ███    ███ Phase 2 ████    ███ Phase 3 ████    ███ Polish ███
                                                           
│ Auth & IAM    │    │ Payments      │    │ Reports       │    │ Performance  │
│ Customers     │    │ QC            │    │ Documents     │    │ Security     │
│ Vehicles      │    │ Multi-Branch  │    │ Notifications │    │ Audit        │
│ Work Orders   │    │ Transfers     │    │ Integrations  │    │ Hardening    │
│ Inventory     │    │ Service Cat   │    │ Time Tracking │    │ Load Testing │
│ Purchasing    │    │ Invoicing     │    │ Advanced UI   │    │ Production   │
│ Labor/Services│    │ Credit Notes  │    │ Mobile Opt    │    │ Launch       │
│ Basic Dashboard│   │ Supplier Mgmt │    │ Reports       │    │              │
│ Invoicing v1   │   │ Dashboard v2  │    │ Notifications │    │              │
└────────────────┘   └────────────────┘   └────────────────┘   └──────────────┘
```

---

# 10.2 MVP v1.0 (3 Months)

## Sprint 1-2: Foundation (Weeks 1-4)

**Backend:**
- Project scaffolding (NestJS + Prisma + modules structure)
- PostgreSQL schema creation with migrations
- Auth module (JWT login, refresh, register)
- RBAC module (roles, permissions, guards)
- Multi-branch module (branches, assignments)
- Docker Compose for local development
- Redis + BullMQ setup

**Frontend:**
- Next.js 15 scaffolding with TailwindCSS + shadcn/ui
- Auth pages (login, forgot password, reset password)
- Layout component (sidebar, header, branch switcher)
- Zustand stores (auth, branch, theme)
- React Query setup

**DevOps:**
- Docker Compose (PostgreSQL, Redis, API, Frontend)
- GitHub Actions (lint, build, test)
- Environment configuration (.env.example)
- README with setup instructions

## Sprint 3-4: Core Domain (Weeks 5-8)

**Backend:**
- Customer module CRUD
- Vehicle module with VIN decoding (NHTSA API integration)
- Work Order module (full CRUD + status machine)
  - Status transitions with validation
  - Labor entries CRUD
  - Part entries CRUD
  - Notes CRUD
  - Attachments upload to S3
  - Status history tracking
- Service/Labor catalog CRUD
- Basic Dashboard KPIs endpoint

**Frontend:**
- Customer list + form pages
- Vehicle list + form + VIN decode
- Work Order Kanban board (drag-and-drop via dnd-kit)
- Work Order detail page (tabs: labor, parts, notes, attachments, timeline)
- Work Order create/edit form
- Service catalog page

## Sprint 5-6: Operations (Weeks 9-12)

**Backend:**
- Inventory module (stock items, warehouses, batches)
- Stock movements
- Low stock detection (BullMQ job)
- Purchasing module (suppliers, POs, receiving)
- Invoicing module (generate from WO, taxes, discounts, statuses)
- Invoice PDF generation
- Dashboard endpoint completion (charts, activity)

**Frontend:**
- Inventory pages (items list, detail, warehouse management)
- Low stock alerts display
- Purchasing pages (supplier list, PO list, PO form, receiving)
- Invoicing pages (list, detail, generate from WO)
- Invoice PDF preview/download
- Dashboard with charts (Recharts)
- Activity feed component

**Testing:**
- Unit tests for domain services (60% coverage)
- Integration tests for key API endpoints
- E2E test setup (Playwright)

## MVP Deliverables

| Module | Backend | Frontend | Tests |
|--------|---------|----------|-------|
| Auth & IAM | ✅ | ✅ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Vehicles | ✅ | ✅ | ✅ |
| Work Orders | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ✅ |
| Purchasing | ✅ | ✅ | ✅ |
| Labor/Services | ✅ | ✅ | ✅ |
| Invoicing | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Multi-Branch | ✅ | ✅ | — |
| Documents (basic) | ✅ | ✅ | — |

---

# 10.3 Phase 2 (3 Months, Weeks 13-24)

## Sprint 7-8: Financials (Weeks 13-16)

- Payment module (CASH, CARD, BANK_TRANSFER, CHECK)
- Partial payments + allocations
- Payment reconciliation
- Credit notes
- Advanced tax engine (compound tax, exemptions)
- Accountant dashboard views

## Sprint 9-10: Quality + Multi-Branch (Weeks 17-20)

- QC checklist templates CRUD
- QC inspection workflow
- Delivery blocking rules
- QC pass/fail → WO status integration
- Multi-branch inventory transfers
- Transfer order workflow
- Branch-switching UX

## Sprint 11-12: Reports v1 (Weeks 21-24)

- Financial reports (P&L, revenue, AR aging, tax)
- Workshop reports (jobs, avg time, status distribution)
- Mechanic reports (productivity, utilization)
- Inventory reports (valuation, slow movers, reorder)
- CSV/Excel export
- Report scheduling (BullMQ)

---

# 10.4 Phase 3 (3 Months, Weeks 25-36)

## Sprint 13-14: Notifications + Documents (Weeks 25-28)

- In-app notification system
- Notification types: WO status, parts, QC, payments
- Email notification architecture (Nodemailer + templates)
- Document management (versioning, search, categories)
- S3 pre-signed URL generation

## Sprint 15-16: Advanced Features (Weeks 29-32)

- Advanced time tracking (break tracking, non-billable time)
- Mechanic productivity metrics dashboard
- Audit log viewer + tamper verification
- Advanced search (full-text across entities)
- Data export/import

## Sprint 17-18: Polish & Optimization (Weeks 33-36)

- Mobile responsive optimization
- Dark mode refinement
- Performance optimization (query optimization, caching)
- Accessibility audit + fixes
- Security audit + penetration testing
- Load testing + horizontal scaling tests

---

# 10.5 Team Structure

## Core Team (MVP)

| Role | Count | Responsibility |
|------|-------|----------------|
| Technical Lead / Architect | 1 | Architecture decisions, code review, technical debt |
| Senior Backend Engineer | 2 | NestJS modules, domain logic, API design |
| Senior Frontend Engineer | 1 | Next.js pages, components, state management |
| Junior Frontend Engineer | 1 | UI components, forms, styling |
| DevOps Engineer | 1 (shared) | CI/CD, Docker, AWS, monitoring |
| QA Engineer | 1 | Test strategy, automation, manual testing |
| Product Manager | 1 | Requirements, backlog, stakeholder mgmt |
| UI/UX Designer | 1 (shared) | Design system, wireframes, prototypes |

## Extended Team (Phase 2+)

| Role | Count | Added For |
|------|-------|-----------|
| Full-stack Engineer | +1 | Phase 2 module development |
| QA Engineer | +1 | E2E automation, performance testing |
| DevOps Engineer | +1 | Production operations, monitoring |

---

# 10.6 Estimated Timeline

| Phase | Duration | Team Size | Effort (person-weeks) |
|-------|----------|-----------|----------------------|
| Foundation (Sprints 1-2) | 4 weeks | 5-6 | 20-24 |
| Core Domain (Sprints 3-4) | 4 weeks | 6-7 | 24-28 |
| Operations (Sprints 5-6) | 4 weeks | 7 | 28 |
| *MVP v1.0 Total* | *12 weeks* | *5-7* | *72-80* |
| Phase 2 (Sprints 7-12) | 12 weeks | 8 | 96 |
| Phase 3 (Sprints 13-18) | 12 weeks | 9 | 108 |
| **Total to v1.0 Launch** | **36 weeks** | **5-9** | **276-284** |

## Velocity Assumptions

- Sprint length: 2 weeks
- Average velocity: 25-35 story points per sprint (team of 6-7)
- Focus factor: 70% (meetings, code review, etc.)
- Story point = ideal engineering day

---

# 10.7 Risk Management

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | High | Strict MVP definition, feature freeze during sprints |
| VIN API rate limits | Medium | Medium | Caching, local fallback, premium API for production |
| Performance at scale | Medium | High | CQRS + Redis caching from day 1, load test in Phase 3 |
| Team ramp-up time | Medium | Medium | Detailed architecture docs, pair programming, mob sessions |
| Third-party integration delays | Low | Medium | Mock/stub all integrations, add real connectors in Phase 3 |
| Security vulnerability | Low | Critical | Security review in every sprint, penetration testing before launch |

---

*End of Phase 10 — Development Plan*
