# Phase 12 — DevOps & Deployment

## Platform: Mechanica
## Document Version: 1.0

---

# 12.1 Docker Structure

## Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/main"]
```

## Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

## Worker Dockerfile (BullMQ)

```dockerfile
# worker/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

CMD ["node", "dist/workers/main"]
```

---

# 12.2 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: mechanica-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: ${DB_USER:-mechanica}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-mechanica_secret}
      POSTGRES_DB: ${DB_NAME:-mechanica}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mechanica"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mechanica-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD:-redis_secret}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mechanica-api
    restart: unless-stopped
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER:-mechanica}:${DB_PASSWORD:-mechanica_secret}@postgres:5432/${DB_NAME:-mechanica}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis_secret}@redis:6379
      JWT_SECRET: ${JWT_SECRET:-dev-jwt-secret}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev-refresh-secret}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      S3_BUCKET: ${S3_BUCKET:-mechanica-documents}
      S3_ENDPOINT: ${S3_ENDPOINT:-http://localhost:9000}  # MinIO for dev
      SMTP_HOST: ${SMTP_HOST:-mailhog}
      SMTP_PORT: 1025
    volumes:
      - ./backend:/app
      - /app/node_modules

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.worker
    container_name: mechanica-worker
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER:-mechanica}:${DB_PASSWORD:-mechanica_secret}@postgres:5432/${DB_NAME:-mechanica}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis_secret}@redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mechanica-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      - api
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

  nginx:
    image: nginx:alpine
    container_name: mechanica-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./infrastructure/nginx/sites:/etc/nginx/sites-enabled
    depends_on:
      - api
      - frontend

  minio:
    image: minio/minio
    container_name: mechanica-minio
    restart: unless-stopped
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD:-minioadmin}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  mailhog:
    image: mailhog/mailhog
    container_name: mechanica-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

# 12.3 Nginx Configuration

```nginx
# infrastructure/nginx/nginx.conf
events {
  worker_connections 1024;
  multi_accept on;
  use epoll;
}

http {
  upstream api {
    server api:4000;
    keepalive 64;
  }

  upstream frontend {
    server frontend:3000;
    keepalive 64;
  }

  # API Proxy
  server {
    listen 80;
    server_name api.mechanica.local;

    client_max_body_size 50M;

    location / {
      proxy_pass http://api;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;

      # Rate limiting
      limit_req zone=api burst=20 nodelay;
    }

    # Health check
    location /health {
      proxy_pass http://api/api/v1/health;
      access_log off;
    }
  }

  # Frontend Proxy
  server {
    listen 80;
    server_name app.mechanica.local;

    location / {
      proxy_pass http://frontend;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }

    # Static assets cache
    location /_next/static {
      proxy_pass http://frontend;
      proxy_cache static_cache;
      proxy_cache_valid 200 365d;
      add_header Cache-Control "public, immutable";
    }
  }

  # Rate limit zones
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

  # Cache zones
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=1g inactive=365d;
}
```

---

# 12.4 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high
      - name: Run Trivy scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'HIGH,CRITICAL'

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  test-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/postgres
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/postgres
          REDIS_URL: redis://:test@localhost:6379

  build-push:
    needs: [lint, security, test-unit, test-integration]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    strategy:
      matrix:
        service: [api, worker, frontend]
    steps:
      - uses: actions/checkout@v4
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service == 'worker' && 'backend' || matrix.service == 'api' && 'backend' || matrix.service }}
          file: ./${{ matrix.service == 'worker' && 'backend/Dockerfile.worker' || matrix.service == 'api' && 'backend/Dockerfile' || matrix.service == 'frontend' && 'frontend/Dockerfile' || '' }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: [build-push]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: infrastructure/ecs/task-definition-staging.json
          service: mechanica-staging
          cluster: mechanica-staging
          wait-for-service-stability: true

  deploy-production:
    needs: [build-push]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: infrastructure/ecs/task-definition-production.json
          service: mechanica-production
          cluster: mechanica-production
          wait-for-service-stability: true
```

---

# 12.5 Production Deployment (AWS ECS Fargate)

## Infrastructure Components

| Component | Service | Configuration |
|-----------|---------|---------------|
| Compute | ECS Fargate | API: 2 tasks × 2 vCPU / 4GB RAM |
| Compute | ECS Fargate | Worker: 1 task × 1 vCPU / 2GB RAM |
| Compute | ECS Fargate | Frontend: 2 tasks × 1 vCPU / 2GB RAM |
| Database | RDS PostgreSQL | db.r6g.large, Multi-AZ, 100GB gp3 |
| Cache | ElastiCache Redis | cache.r6g.large, Multi-AZ, 50GB |
| Storage | S3 | Standard tier, versioning enabled |
| CDN | CloudFront | Frontend + API caching |
| DNS | Route 53 | app.mechanica.com, api.mechanica.com |
| Email | SES | Production sending enabled |
| Secrets | Secrets Manager | DB creds, JWT keys, API keys |
| Monitoring | CloudWatch | Logs, metrics, alarms, dashboards |
| WAF | WAF | Rate limiting, IP blocking, OWASP rules |

## ECS Task Definition (API)

```json
{
  "family": "mechanica-api",
  "taskRoleArn": "arn:aws:iam::xxxx:role/mechanica-api-task-role",
  "executionRoleArn": "arn:aws:iam::xxxx:role/mechanica-api-execution-role",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "ghcr.io/mechanica/api:latest",
      "essential": true,
      "portMappings": [
        { "containerPort": 4000, "protocol": "tcp" }
      ],
      "environment": [
        { "name": "NODE_ENV", "value": "production" },
        { "name": "PORT", "value": "4000" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxx:secret:db-url" },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxx:secret:redis-url" },
        { "name": "JWT_PRIVATE_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxx:secret:jwt-private-key" },
        { "name": "JWT_PUBLIC_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:xxxx:secret:jwt-public-key" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mechanica-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:4000/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

# 12.6 Monitoring & Observability

## CloudWatch Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MECHANICA — PRODUCTION DASHBOARD                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ API 200s   │  │ API 5xx    │  │ Avg Resp   │  │ Active     │       │
│  │ 98.5%      │  │ 0.02%      │  │ 245ms      │  │ Users: 23  │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  API Response Time (p50/p95) │  │  Error Rate by Endpoint      │    │
│  │  ┌──────────────────────┐    │  │  ┌──────────────────────┐    │    │
│  │  │  ████████████████    │    │  │  │  ████████████████    │    │    │
│  │  └──────────────────────┘    │  │  └──────────────────────┘    │    │
│  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  ECS Service CPU/Memory      │  │  RDS Connections / Replica   │    │
│  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐    │
│  │  BullMQ Queue Depth          │  │  S3 Storage Used             │    │
│  └──────────────────────────────┘  └──────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Alarms

| Alarm | Metric | Threshold | Action |
|-------|--------|-----------|--------|
| API High Error Rate | 5xx count | > 1% over 5 min | SNS → Slack + PagerDuty |
| API High Latency | p95 response time | > 1s over 5 min | SNS → Slack |
| RDS High CPU | CPU utilization | > 80% over 10 min | SNS → Slack, consider scaling |
| RDS Storage | Free storage | < 20% | SNS → Slack, increase storage |
| Redis High Memory | Memory usage | > 80% | SNS → Slack |
| BullMQ Queue Depth | Queue size | > 1000 | SNS → Slack |
| ECS Task Crash | Stopped tasks | > 0 in 5 min | SNS → PagerDuty |

---

# 12.7 Logging Strategy

## Log Format (Structured JSON)

```json
{
  "level": "info",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "requestId": "req_abc123",
  "service": "mechanica-api",
  "module": "WorkOrderController",
  "action": "createWorkOrder",
  "userId": "user-uuid",
  "branchId": "branch-uuid",
  "duration": 142,
  "statusCode": 201,
  "metadata": {
    "woNumber": "WO-2024-00042"
  },
  "error": null
}
```

## Log Levels

| Level | Usage |
|-------|-------|
| ERROR | Unhandled exceptions, business rule violations, external service failures |
| WARN | Deprecated API usage, slow queries (> 500ms), rate limit approaching |
| INFO | Request start/complete, status changes, entity creation |
| DEBUG | Detailed operation info (enabled only in dev/staging) |
| TRACE | Full request/response bodies (enabled only in dev) |

## Log Aggregation
- CloudWatch Logs for all services
- Log retention: 30 days (standard), 7 years (audit logs)
- Log groups per service: `/ecs/mechanica-api`, `/ecs/mechanica-worker`, `/ecs/mechanica-frontend`

---

# 12.8 Backup & Disaster Recovery

## Backup Schedule

| Component | Type | Frequency | Retention | RPO | RTO |
|-----------|------|-----------|-----------|-----|-----|
| PostgreSQL | Automated snapshot | Every 15 min | 35 days | 15 min | 1 hour |
| PostgreSQL | Manual snapshot | Daily | 90 days | — | — |
| PostgreSQL | Transaction logs | Continuous (WAL) | 7 days | seconds | — |
| Redis | AOF persistence | Continuous | — | seconds | — |
| S3 Documents | Cross-region replication | Real-time | Indefinite | minutes | — |
| Bulk exports | S3 backup | Daily | 365 days | 24 hours | — |

## Disaster Recovery Plan

### Scenario 1: Single AZ Failure
- RDS Multi-AZ auto-failover (60s)
- ECS tasks spread across AZs
- Redis Multi-AZ auto-failover
- No data loss, ~1 minute downtime

### Scenario 2: Region Failure
1. Route 53 failover to secondary region
2. Promote read replica to primary in DR region
3. Launch ECS tasks in DR region
4. Point CloudFront to DR region
5. Estimated RTO: 30 minutes
6. Estimated RPO: 15 minutes

### Scenario 3: Data Corruption
1. Stop application
2. Restore database from last clean snapshot
3. Replay WAL logs to point before corruption
4. Verify data integrity
5. Resume application
6. Estimated RTO: 2 hours
7. Estimated RPO: 15 minutes

## Backup Verification
- Automated restore test every week (staging environment)
- Checksum verification on S3 backups
- Transaction log replay test monthly

---

# 12.9 Environment Configuration

## Environment Files

```
.env.development       # Local dev
.env.staging            # Staging (AWS)
.env.production         # Production (AWS)
```

```bash
# .env.production (AWS Secrets Manager)
NODE_ENV=production
PORT=4000

# Database
DATABASE_URL=postgresql://user:password@host:5432/mechanica?sslmode=require
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://:password@host:6379
REDIS_PREFIX=mechanica:prod:

# JWT
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AWS
AWS_REGION=us-east-1
S3_BUCKET=mechanica-prod-documents
S3_PRESIGNED_URL_TTL=3600

# Email
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
EMAIL_FROM=noreply@mechanica.app

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
AUTH_THROTTLE_LIMIT=10

# Features
ENABLE_AUDIT_HASH_CHAIN=true
AUDIT_RETENTION_DAYS=2555  # 7 years
```

---

*End of Phase 12 — DevOps & Deployment*
