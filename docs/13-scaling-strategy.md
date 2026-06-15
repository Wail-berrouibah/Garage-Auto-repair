# Phase 13 — Scaling Strategy

## Platform: Mechanica
## Document Version: 1.0

---

# 13.1 Scaling Tiers

| Tier | Users | Branches | WOs/month | Stock Items | DB Size | Infrastructure |
|------|-------|----------|-----------|-------------|---------|----------------|
| S | 10-50 | 1-2 | 500 | 1,000 | < 5 GB | Single server (Docker Compose) |
| M | 50-500 | 2-10 | 5,000 | 10,000 | 5-50 GB | ECS Fargate + RDS Single-AZ |
| L | 500-2,000 | 10-30 | 25,000 | 50,000 | 50-200 GB | ECS Fargate + RDS Multi-AZ + Read Replicas |
| XL | 2,000-10,000 | 30-100 | 100,000 | 200,000 | 200 GB+ | ECS/EKS + RDS Cluster + Sharding |

---

# 13.2 Tier S: 10-50 Users

## Architecture
```
┌──────────────────────────────────────────┐
│            Single VPS / Server            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Docker Compose                    │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │ NGINX  │ │ NextJS │ │ NestJS │ │  │
│  │  │ 80/443 │ │:3000   │ │:4000   │ │  │
│  │  └────────┘ └────────┘ └────────┘ │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ │  │
│  │  │Postgres│ │ Redis  │ │ Worker │ │  │
│  │  │:5432   │ │:6379   │ │:4001   │ │  │
│  │  └────────┘ └────────┘ └────────┘ │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Specs: 4 vCPU, 16 GB RAM, 100 GB SSD    │
└──────────────────────────────────────────┘
```

**Backups:** pg_dump to S3 daily, WAL archiving
**Monitoring:** Uptime Kuma, basic CloudWatch
**Cost:** ~$50-100/month

---

# 13.3 Tier M: 50-500 Users

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       AWS — SINGLE REGION                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  CloudFront (CDN)                                               │    │
│  └─────────────────────────┬───────────────────────────────────────┘    │
│                            │                                            │
│  ┌─────────────────────────▼───────────────────────────────────────┐    │
│  │  ALB (Application Load Balancer)                                │    │
│  └─────────────────────────┬───────────────────────────────────────┘    │
│                            │                                            │
│  ┌─────────────────────────▼───────────────────────────────────────┐    │
│  │  ECS Fargate Cluster                                            │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │    │
│  │  │  Frontend  │ │  Frontend  │ │   API      │ │   API      │   │    │
│  │  │  (x1)      │ │  (x2)      │ │  (x2)      │ │  (x2)      │   │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │    │
│  │  ┌────────────┐ ┌────────────┐                                 │    │
│  │  │  Worker    │ │  Worker    │                                 │    │
│  │  │  (x1)      │ │  (x2)      │                                 │    │
│  │  └────────────┘ └────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                            │                                            │
│  ┌────────────┬────────────┼────────────┬──────────────────────────┐   │
│  │            │            │            │                          │   │
│  ▼            ▼            ▼            ▼                          │   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐                 │   │
│  │ RDS    │ │ Redis  │ │ Redis  │ │ S3            │                 │   │
│  │Primary │ │ Cache  │ │ BullMQ │ │ + CloudFront   │                 │   │
│  │        │ │        │ │        │ │                │                 │   │
│  └────────┘ └────────┘ └────────┘ └──────────────┘                 │   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Scaling levers:**
- API: 2→4 tasks (horizontal)
- Frontend: 1→2 tasks (horizontal)
- RDS: db.r6g.large → db.r6g.xlarge
- Redis: cache.r6g.large → cache.r6g.xlarge

**Backups:** Automated RDS snapshots every 15 min, WAL archiving to S3
**Cost:** ~$500-2,000/month

---

# 13.4 Tier L: 500-2,000 Users

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AWS — SINGLE REGION, HA                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  CloudFront + WAF                                               │    │
│  └──────────┬──────────────────────────────────────────────────────┘    │
│             │                                                           │
│  ┌──────────▼──────────────────────────────────────────────────────┐    │
│  │  ALB + Target Groups (spread across AZs)                        │    │
│  └──────────┬──────────────────────────────────────────────────────┘    │
│             │                                                           │
│  ┌──────────▼──────────────────────────────────────────────────────┐    │
│  │  ECS Fargate Cluster (Spot + On-Demand mix)                      │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │    │
│  │  │  Frontend  │ │  Frontend  │ │   API      │ │   API      │   │    │
│  │  │  (x2)      │ │  (x4)      │ │  (x4)      │ │  (x6)      │   │    │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │    │
│  │  ┌────────────┐ ┌────────────┐                                 │    │
│  │  │  Worker    │ │  Worker    │                                 │    │
│  │  │  (x2)      │ │  (x4)      │                                 │    │
│  │  └────────────┘ └────────────┘                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│             │                                                           │
│  ┌──────────┼──────────────────┬──────────────────────────────────┐    │
│  │          │                  │                                  │    │
│  ▼          ▼                  ▼                                  ▼    │
│  ┌──────┐ ┌──────┐ ┌──────────────────┐ ┌────────────────────────┐    │
│  │ RDS  │ │ RDS  │ │  ElastiCache     │ │ S3                     │    │
│  │Pri   │ │Read  │ │  Redis Cluster   │ │ + Lifecycle Policies   │    │
│  │mary  │ │Repl  │ │  (Cache + Queue) │ │ + Cross-region repl    │    │
│  │Multi │ │(x2)  │ │                  │ │                        │    │
│  │AZ    │ │      │ │  Shards: 2       │ │                        │    │
│  └──────┘ └──────┘ └──────────────────┘ └────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Scaling (Tier L)

### Read Replicas
- 2 read replicas for reporting queries
- Dashboard queries directed to replicas
- CQRS: Commands go to primary, Queries go to replicas

### Connection Pooling
- PgBouncer (transaction mode) for connection pooling
- Max connections: 100 per API task × 6 tasks = 600
- PgBouncer pool: 200 connections

### Query Optimization
- Materialized views for reports (refresh via BullMQ)
- Partial indexes for filtered queries
- Query timeout: 10s (configurable)
- Statement timeout: 30s

## Redis Scaling (Tier L)

```
Redis Cluster (3 shards, 2 replicas each)
  - Shard 1: Session + Auth cache
  - Shard 2: Query cache + Rate limiter
  - Shard 3: BullMQ queues
```

**Cost:** ~$3,000-8,000/month

---

# 13.5 Tier XL: 2,000-10,000 Users

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AWS — MULTI-REGION (Active-Passive)                  │
│                                                                         │
│  ┌─────────────────────┐          ┌─────────────────────┐               │
│  │  Region: us-east-1   │          │  Region: us-west-2  │               │
│  │  (Primary)           │          │  (DR)               │               │
│  │                      │          │                     │               │
│  │  ┌─────────────────┐ │          │  ┌────────────────┐ │               │
│  │  │  CloudFront +   │ │          │  │  CloudFront    │ │               │
│  │  │  WAF + Shield   │ │          │  │  + WAF         │ │               │
│  │  └────────┬────────┘ │          │  └───────┬────────┘ │               │
│  │           │           │          │          │          │               │
│  │  ┌────────▼────────┐ │          │  ┌───────▼────────┐ │               │
│  │  │  EKS Cluster    │ │          │  │  EKS Cluster   │ │               │
│  │  │  (Kubernetes)   │ │          │  │  (Standby)     │ │               │
│  │  │                 │ │          │  │                │ │               │
│  │  │  API: 12 tasks  │ │          │  │  API: 4 tasks  │ │               │
│  │  │  Worker: 8 tasks│ │          │  │  Worker: 2     │ │               │
│  │  │  Frontend: 4    │ │          │  │  Frontend: 2   │ │               │
│  │  └────────┬────────┘ │          │  └───────┬────────┘ │               │
│  │           │           │          │          │          │               │
│  │  ┌────────▼────────┐ │          │  ┌───────▼────────┐ │               │
│  │  │  RDS Cluster    │ │          │  │  RDS Read      │ │               │
│  │  │  (1 writer,     │ │          │  │  Replica       │ │               │
│  │  │   3 readers)    │ │          │  │                │ │               │
│  │  └─────────────────┘ │          │  └────────────────┘ │               │
│  │                       │          │                     │               │
│  │  ┌─────────────────┐ │          │  ┌────────────────┐ │               │
│  │  │  ElastiCache    │ │          │  │  ElastiCache   │ │               │
│  │  │  (Cluster: 6+3) │ │          │  │  (Cluster: 3)  │ │               │
│  │  └─────────────────┘ │          │  └────────────────┘ │               │
│  │                       │          │                     │               │
│  │  ┌─────────────────┐ │          │                     │               │
│  │  │  S3 + Bucket    │ │          │                     │               │
│  │  │  Replication    │◀┼──────────│─────────────────────│               │
│  │  └─────────────────┘ │          │                     │               │
│  └───────────────────────┘          └─────────────────────┘               │
│                                                                         │
│  Route 53: Active-Passive failover                                      │
│  - Health checks on ALB                                                 │
│  - Failover in < 60s                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Database Sharding Strategy (XL)

### Approach: Functional Sharding + CQRS

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE SHARDING                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Primary Cluster (Writes):                                           │
│  ├── Shard 1: Core Transactions (work_orders, invoices, payments)    │
│  ├── Shard 2: Inventory & Purchasing (stock_items, POs, movements)   │
│  └── Shard 3: Customers & Vehicles                                   │
│                                                                      │
│  Read Replicas (per shard):                                          │
│  ├── Replica 1a: Real-time dashboard queries                         │
│  ├── Replica 1b: Report queries                                     │
│  ├── Replica 2a: Inventory queries                                  │
│  └── Replica 3a: Customer/vehicle lookups                           │
│                                                                      │
│  Dedicated:                                                          │
│  ├── Audit DB (partitioned by month, append-only writes)             │
│  └── Analytics DB (ETL from primary, materialized views)            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Caching Strategy (XL)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  L1: In-Memory (Node.js process)                                    │
│  ├── TTL: 1-5 seconds                                               │
│  ├── Data: Reference data (services, rates, settings)               │
│  └── Size: ~50MB per instance                                       │
│                                                                      │
│  L2: Redis Cluster                                                  │
│  ├── TTL: 30-300 seconds                                            │
│  ├── Data: Query results, session data, rate limits                 │
│  ├── Max Memory: 50GB per shard                                     │
│  └── Eviction: allkeys-lru                                          │
│                                                                      │
│  L3: CDN (CloudFront)                                               │
│  ├── TTL: 1-365 days                                                │
│  ├── Data: Static assets, report PDFs, public images                │
│  └── Cache invalidation via API                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Queue Scaling

```
┌─────────────────────────────────────────────────────────────────────┐
│              BULLMQ — PRODUCER / WORKER SCALING                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Queues:                                                             │
│  ├── notifications         (priority: HIGH, concurrency: 10)        │
│  ├── email                 (priority: MEDIUM, concurrency: 5)       │
│  ├── audit-log             (priority: LOW, concurrency: 20)         │
│  ├── report-generation     (priority: LOW, concurrency: 3)          │
│  ├── stock-reorder         (priority: MEDIUM, concurrency: 5)       │
│  └── pdf-generation        (priority: MEDIUM, concurrency: 5)       │
│                                                                      │
│  Workers:                                                            │
│  ├── Default: 4 worker instances                                     │
│  ├── Scale based on queue depth (autoscaling)                        │
│  └── Max: 20 worker instances                                       │
│                                                                      │
│  Redis Queue Backend:                                                │
│  ├── Cluster: 6 shards, 3 replicas                                  │
│  ├── Max memory: 100GB                                              │
│  └── Retention: 7 days (completed jobs)                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Storage Scaling

| Type | Tier M | Tier L | Tier XL |
|------|--------|--------|---------|
| S3 Documents | 100 GB | 1 TB | 10 TB |
| S3 Backups | 50 GB | 500 GB | 5 TB |
| S3 Logs | 10 GB | 100 GB | 1 TB |
| Lifecycle | None | Transition to IA after 30d | Glacia after 90d, Deep Archive after 365d |

---

# 13.6 Multi-Region Strategy

## Active-Passive (Tier XL)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Route 53: Latency-based routing with health checks                     │
│                                                                         │
│  Normal Operation:                                                      │
│  ┌─────────────┐     ┌─────────────┐                                    │
│  │  us-east-1   │◀──── 100% traffic                                     │
│  │  (Active)    │                                                        │
│  └─────────────┘     ┌─────────────┐                                    │
│                      │  us-west-2   │  (Warm standby)                    │
│                      │  (Standby)   │                                    │
│                      └─────────────┘                                    │
│                                                                         │
│  Failover:                                                              │
│  ┌─────────────┐                                                        │
│  │  us-east-1   │  (Unhealthy → Route 53 detects failure)              │
│  │  (Failed)    │                                                        │
│  └─────────────┘     ┌─────────────┐                                    │
│                      │  us-west-2   │◀──── 100% traffic after ~60s      │
│                      │  (Active)    │                                    │
│                      └─────────────┘                                    │
│                                                                         │
│  Data Replication:                                                      │
│  - RDS Cross-Region Read Replica                                       │
│  - S3 Cross-Region Replication (same-region for documents)             │
│  - RPO: < 1 second (synchronous replication)                           │
│  - RTO: < 60 seconds (DNS + health check)                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# 13.7 Autoscaling Configuration

## ECS Service Autoscaling

```yaml
# API Service
api:
  min_capacity: 2
  max_capacity: 20
  target_cpu: 70
  target_memory: 70
  scale_in_cooldown: 300  # 5 min
  scale_out_cooldown: 60  # 1 min

# Worker Service
worker:
  min_capacity: 2
  max_capacity: 30
  custom_metric: "BullMQ Queue Depth > 100"
  scale_out_cooling: 60
  scale_in_cooldown: 300
```

## RDS Scaling

```yaml
# Storage autoscaling
storage_autoscaling:
  enabled: true
  max_storage: 1000  # GB
  threshold_percent: 90

# Instance scaling (manual or scheduled)
instance_sizing:
  tier_m: db.r6g.large
  tier_l: db.r6g.2xlarge
  tier_xl: db.r6g.8xlarge + read replicas
```

---

# 13.8 Cost Projection

| Tier | Compute | Database | Cache | Storage | Network | Total |
|------|---------|----------|-------|---------|---------|-------|
| S (10-50) | $30 | $15 | — | $5 | $5 | ~$55 |
| M (50-500) | $400 | $200 | $150 | $50 | $100 | ~$900 |
| L (500-2K) | $1,500 | $800 | $500 | $200 | $300 | ~$3,300 |
| XL (2K-10K) | $5,000 | $3,000 | $2,000 | $1,000 | $1,000 | ~$12,000 |

---

*End of Phase 13 — Scaling Strategy*
