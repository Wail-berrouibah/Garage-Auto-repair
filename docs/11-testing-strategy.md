# Phase 11 — Testing Strategy

## Platform: Mechanica
## Document Version: 1.0

---

# 11.1 Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲
                 ╱ Tests╲
                ╱────────╲
               ╱          ╲
              ╱Integration ╲
             ╱    Tests     ╲
            ╱────────────────╲
           ╱                  ╲
          ╱────────────────────╲
         ╱                      ╲
        ╱────────────────────────╲
       ╱    Unit Tests (60%+)     ╲
      ╱────────────────────────────╲
     ╱                              ╲
    ╱────────────────────────────────╲
   ╱    Static Analysis + Linting     ╲
  ╱────────────────────────────────────╲
```

## Coverage Targets

| Layer | Tool | Target |
|-------|------|--------|
| Backend Unit Tests | Jest | 60%+ line coverage |
| Backend Integration Tests | Jest + Supertest | 80%+ of critical paths |
| Frontend Unit Tests | Vitest + React Testing Library | 50%+ |
| Frontend Component Tests | Storybook + Vitest | Key components |
| E2E Tests | Playwright | All critical user journeys |
| API Contract Tests | Pact | All external interfaces |
| Security Tests | OWASP ZAP | All OWASP Top 10 |
| Performance Tests | k6 | P95 < 500ms API, < 2s pages |

---

# 11.2 Unit Tests

## Backend (Jest + ts-jest)

### What to test
- Domain services (business logic, invariants)
- Value objects (immutability, validation)
- Domain events (publishing, handling)
- Command/Query handlers (isolated from infrastructure)
- DTO validation (class-validator decorators)
- Custom decorators (guards, pipes)
- Utility functions

### What NOT to test
- Prisma queries (tested in integration)
- Controller wiring (tested in integration)
- External API calls (mocked)
- Framework behavior (NestJS internals)

### Example test structure

```typescript
// tests/unit/work-orders/__tests__/status-machine.spec.ts
describe('WorkOrderStatusMachine', () => {
  const machine = new WorkOrderStatusMachine();

  describe('canTransition', () => {
    it('should allow OPEN → DIAGNOSED', () => {
      expect(machine.canTransition('OPEN', 'DIAGNOSED')).toBe(true);
    });

    it('should reject OPEN → COMPLETED (skip states)', () => {
      expect(machine.canTransition('OPEN', 'COMPLETED')).toBe(false);
    });

    it('should allow QUALITY_CHECK → IN_PROGRESS (QC fail return)', () => {
      expect(machine.canTransition('QUALITY_CHECK', 'IN_PROGRESS')).toBe(true);
    });

    it('should not allow DELIVERED → any other status (terminal state)', () => {
      expect(machine.canTransition('DELIVERED', 'OPEN')).toBe(false);
    });
  });
});
```

### Folder structure

```
backend/
├── src/
│   ├── modules/
│   │   └── work-orders/
│   │       ├── domain/
│   │       ├── application/
│   │       └── ...
│   └── ...
├── tests/
│   ├── unit/
│   │   ├── work-orders/
│   │   ├── inventory/
│   │   ├── invoicing/
│   │   └── shared/
│   ├── integration/
│   └── e2e/
```

---

# 11.3 Integration Tests

## Backend (Jest + Supertest + Testcontainers)

### Test Infrastructure
- Testcontainers for PostgreSQL + Redis
- Each test suite gets isolated database
- Prisma migrations run before test suite
- Seed data for test scenarios

### What to test
- Full API endpoints (request → controller → service → DB → response)
- Auth guard integration
- RBAC guard integration
- Prisma queries (correctness)
- Status machine integration with DB
- Event publishing/subscribing
- File upload/download flow

### Example

```typescript
// tests/integration/work-orders/work-orders.spec.ts
describe('Work Orders API (integration)', () => {
  let app: INestApplication;
  let authToken: string;
  let customerId: string;
  let vehicleId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Create test user + get token
    authToken = await createTestUser(app);
    customerId = await createTestCustomer(app, authToken);
    vehicleId = await createTestVehicle(app, authToken);
  });

  describe('POST /work-orders', () => {
    it('should create a work order with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          vehicleId,
          complaint: 'Check engine light on',
          priority: 'NORMAL',
        })
        .expect(201);

      expect(res.body.data.status).toBe('OPEN');
      expect(res.body.data.woNumber).toMatch(/^WO-/);
    });

    it('should reject work order without complaint', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ customerId, vehicleId })
        .expect(400);
    });

    it('should reject unauthorized request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/work-orders')
        .send({ customerId, vehicleId, complaint: 'test' })
        .expect(401);
    });
  });
});
```

---

# 11.4 E2E Tests (Playwright)

## Critical User Journeys (CUJs)

| CUJ | Description | Pages Covered |
|-----|-------------|---------------|
| CUJ-01 | User logs in, sees dashboard | Login → Dashboard |
| CUJ-02 | Receptionist checks in vehicle | Login → New WO → Customer search → Vehicle search → Create WO |
| CUJ-03 | Manager assigns mechanic | Kanban → Drag WO to IN_PROGRESS → Assign |
| CUJ-04 | Mechanic adds labor and time | WO detail → Add labor → Clock in/out |
| CUJ-05 | Parts request and inventory update | WO detail → Add part → Inventory update |
| CUJ-06 | QC inspection | Kanban → QUALITY_CHECK → QC inspection → Pass/Fail |
| CUJ-07 | Invoice generation and payment | Completed WO → Generate invoice → Record payment |
| CUJ-08 | Purchase order creation | Purchasing → New PO → Add line items → Send |
| CUJ-09 | Stock receiving from PO | Purchase orders → Receive → Verify stock |
| CUJ-10 | Multi-branch inventory transfer | Transfers → Create → Approve → Receive |

### Example Playwright test

```typescript
// tests/e2e/invoice-payment.spec.ts
test('Invoice generation and payment flow', async ({ page }) => {
  // Login as manager
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'manager@mechanica.app');
  await page.fill('[data-testid="password"]', 'Test1234!');
  await page.click('[data-testid="login-btn"]');
  await expect(page).toHaveURL(/\/app\/dashboard/);

  // Navigate to completed work order
  await page.click('[data-testid="nav-work-orders"]');
  await page.click('[data-testid="kanban-column-COMPLETED"]');
  await page.click('[data-testid="wo-card-040"]');

  // Generate invoice
  await page.click('[data-testid="generate-invoice-btn"]');
  await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('DRAFT');
  await page.click('[data-testid="issue-invoice-btn"]');
  await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('ISSUED');

  // Record payment
  await page.click('[data-testid="record-payment-btn"]');
  await page.fill('[data-testid="payment-amount"]', '250.00');
  await page.selectOption('[data-testid="payment-method"]', 'CARD');
  await page.click('[data-testid="submit-payment-btn"]');
  await expect(page.locator('[data-testid="invoice-balance"]')).toHaveText('$0.00');
  await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('PAID');
});
```

---

# 11.5 Security Tests

## Automated Security Scanning

| Tool | Frequency | Scope |
|------|-----------|-------|
| ESLint security plugin | Every commit | Code-level vulnerabilities |
| npm audit / yarn audit | CI pipeline | Dependency vulnerabilities |
| Snyk / Dependabot | Daily | Dependency vulnerability monitoring |
| OWASP ZAP | Weekly | Active scanning of staging environment |
| Trivy | CI pipeline | Container image scanning |

## Manual Security Testing (Pre-Launch)

- Penetration testing by external firm
- OWASP Top 10 verification
- Authentication/authorization testing
- Session management testing
- Input validation testing
- Business logic abuse testing

---

# 11.6 Performance & Load Tests (k6)

## Test Scenarios

### Scenario 1: Normal Operation
- 50 virtual users
- Mix of reads (70%) and writes (30%)
- 5 minute duration
- Targets: P95 response < 500ms, error rate < 0.1%

### Scenario 2: Peak Load
- 200 virtual users (ramp up over 2 min)
- Typical branch end-of-day operations
- 10 minute duration
- Targets: P95 < 1s, error rate < 1%

### Scenario 3: Stress Test
- Ramp from 10 → 500 virtual users
- Find breaking point
- Measure recovery time

### Scenario 4: Endurance Test
- 100 virtual users for 8 hours
- Memory leak detection
- Targets: no degradation over time

### Example k6 script

```javascript
// tests/performance/work-orders-api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95) < 500'],
    http_req_failed: ['rate < 0.01'],
  },
};

const BASE_URL = 'https://api-staging.mechanica.app/v1';
const TOKEN = __ENV.AUTH_TOKEN;

export default function () {
  const headers = { Authorization: `Bearer ${TOKEN}` };

  // Get work orders list
  const listRes = http.get(`${BASE_URL}/work-orders?page=1&pageSize=25`, { headers });
  check(listRes, { 'list status 200': (r) => r.status === 200 });

  // Get kanban data
  const kanbanRes = http.get(`${BASE_URL}/work-orders/kanban`, { headers });
  check(kanbanRes, { 'kanban status 200': (r) => r.status === 200 });

  sleep(1);
}
```

---

# 11.7 Test Environment Strategy

| Environment | Purpose | Data | Runs |
|-------------|---------|------|------|
| Local | Dev unit/integration tests | Fresh test DB per run | On every commit (pre-push) |
| CI (PR) | Integration + lint + build | Ephemeral test DB | On PR creation/update |
| CI (main) | Full test suite + security scan | Ephemeral test DB | On merge to main |
| Staging | E2E + Performance + Security | Anonymized production-like data | Daily + Pre-release |
| Production | Smoke tests (synthetic monitoring) | Live data | Continuous (5 min interval) |

---

# 11.8 Test Data Management

- Factory pattern for test data creation
- Prisma seed scripts for common scenarios
- Test data cleanup hooks (afterEach/afterAll)
- Production data anonymization for staging
- No real PII in test data

```typescript
// tests/factories/customer.factory.ts
export function createCustomerFactory(app: INestApplication, token: string) {
  return async (overrides: Partial<CreateCustomerDto> = {}) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Test',
        lastName: 'Customer',
        email: `test-${Date.now()}@example.com`,
        phone: '+1234567890',
        ...overrides,
      });
    return res.body.data;
  };
}
```

---

# 11.9 Test Automation in CI

```yaml
# .github/workflows/test.yml (excerpt)
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:cov

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7-alpine
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

*End of Phase 11 — Testing Strategy*
