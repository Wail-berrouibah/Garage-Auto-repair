# Phase 7 — Security Design

## Platform: Mechanica
## Document Version: 1.0

---

# 7.1 Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  NestJS  │         │    DB    │         │  Redis   │
└────┬─────┘         └────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │                    │
     │ POST /auth/login   │                    │                    │
     │ {email, password}  │                    │                    │
     │───────────────────▶│                    │                    │
     │                    │                    │                    │
     │                    │ Find user by email │                    │
     │                    │───────────────────▶│                    │
     │                    │◀───────────────────│                    │
     │                    │                    │                    │
     │                    │ Verify bcrypt hash │                    │
     │                    │ (constant-time)    │                    │
     │                    │                    │                    │
     │                    │ Generate JWT       │                    │
     │                    │ (access: 15min)    │                    │
     │                    │                    │                    │
     │                    │ Generate refresh   │                    │
     │                    │ token (random 128b)│                    │
     │                    │                    │                    │
     │                    │ Store refresh hash │                    │
     │                    │───────────────────▶│                    │
     │                    │                    │                    │
     │                    │ Store refresh in   │                    │
     │                    │ Redis (TTL: 7d)    │                    │
     │                    │────────────────────────────────────────▶│
     │                    │                    │                    │
     │ {accessToken,      │                    │                    │
     │  refreshToken,     │                    │                    │
     │  user}             │                    │                    │
     │◀───────────────────│                    │                    │
     │                    │                    │                    │
```

## Token Strategy

| Token | Type | Payload | Expiry | Storage |
|-------|------|---------|--------|---------|
| Access Token | JWT (RS256) | sub, email, roles, permissions, branchIds, iat, exp | 15 minutes | Client memory (httpOnly not possible for SPA, use secure session) |
| Refresh Token | Opaque (128-bit random) | — | 7 days | Hashed in DB + Redis |

## Refresh Token Rotation

```
1. Client sends refresh token
2. Server validates against DB + Redis
3. Server invalidates old refresh token
4. Server issues new access + refresh token pair
5. Client stores new tokens
```

If a refresh token is reused (stolen + used by attacker while valid), all tokens for that user are immediately revoked.

---

# 7.2 Authorization Flow

```
1. Client request arrives with Authorization: Bearer <accessToken>
       │
2. JwtAuthGuard:
   a. Extract token from header
   b. Verify JWT signature (RS256, public key)
   c. Check expiry (iat, exp)
   d. Decode payload → user object
   e. Attach user to request
       │
3. RolesGuard (decorator-based):
   a. Check @Roles('MANAGER', 'OWNER') decorator on route
   b. Verify user has at least one required role
       │
4. PermissionsGuard (decorator-based):
   a. Check @Permissions('work_orders:update') decorator
   b. Verify user's roles include this permission
       │
5. BranchGuard:
   a. Check if user has access to requested branchId
   b. BranchId from URL param, query param, or request body
   c. Match against user_branch_assignments
       │
6. Request proceeds to controller
```

## Guard Implementation (NestJS)

```typescript
// guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// guards/rbac.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}
```

---

# 7.3 JWT Strategy

## Algorithm
- RS256 (RSA Signature with SHA-256)
- Public/private key pair
- Private key: stored in AWS Secrets Manager
- Public key: distributed to services

## Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["MANAGER", "INVENTORY_MANAGER"],
  "permissions": ["work_orders:create", "work_orders:read", "inventory:*"],
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],
  "iat": 1705312200,
  "exp": 1705313100,
  "iss": "mechanica-auth",
  "aud": "mechanica-api"
}
```

**JWT Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2024-01-v1"
}
```

---

# 7.4 Password Policy

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Maximum length | 128 characters |
| Uppercase | At least 1 |
| Lowercase | At least 1 |
| Number | At least 1 |
| Special character | At least 1 |
| Common password check | Block top 10,000 common passwords |
| Hash algorithm | bcrypt, cost factor 12 |
| Max failed attempts | 5 before lockout |
| Lockout duration | 30 minutes (or manual unlock) |
| Password history | Last 5 passwords remembered |
| Password expiry | 90 days |
| Password change on first login | Enforced for new accounts |

---

# 7.5 RBAC Matrix (Summary)

See Phase 9 for complete matrix.

| Role | Permissions |
|------|-------------|
| OWNER | Full access, cross-branch, all resources |
| MANAGER | Branch-scoped: work orders, mechanics, inventory, invoices |
| RECEPTIONIST | Customers, vehicles, work orders (create/read), check-in |
| MECHANIC | Own work orders (update), time entries, parts requests, labor entries |
| ACCOUNTANT | Invoices, payments, reports, financial data |
| INVENTORY_MANAGER | Stock items, warehouses, suppliers, POs, transfers |

---

# 7.6 Rate Limiting

| Limit | Scope | Window | Max Requests |
|-------|-------|--------|-------------|
| Global | IP | 1 minute | 60 |
| Auth login | IP | 15 minutes | 10 |
| Auth login | User | 15 minutes | 5 (failed attempts) |
| Password reset | IP | 1 hour | 3 |
| API write | User | 1 minute | 60 |
| API read | User | 1 minute | 300 |
| Report generation | User | 5 minutes | 10 |

Implementation: `@nestjs/throttler` with Redis store.

---

# 7.7 CSRF Protection

**Strategy:** SameSite Cookie + Custom Header

- JWT access token sent in `Authorization: Bearer` header (not cookies)
- No session cookies used for authentication
- State-changing requests require custom header (`X-Requested-With: XMLHttpRequest`)
- CSRF token NOT needed because:
  1. No cookie-based auth
  2. CORS restricts to whitelisted origins
  3. Custom header prevents simple form attacks

---

# 7.8 XSS Protection

| Layer | Measure |
|-------|---------|
| Frontend | React auto-escapes JSX output |
| Frontend | Content-Security-Policy header: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` |
| Frontend | Never use `dangerouslySetInnerHTML` |
| Backend | Input sanitization with `sanitize-html` for rich text fields |
| Backend | Output encoding for all user-generated content |
| Backend | HTTP-only cookies for non-sensitive data |
| Infra | WAF rules for XSS patterns |

---

# 7.9 SQL Injection Protection

**Strategy:** Parameterized queries via Prisma ORM

Prisma generates parameterized SQL for all queries. Raw queries are prohibited in application code. Any raw SQL must be:
1. Reviewed by security team
2. Use parameterized `$queryRaw` with template literals
3. Never concatenate user input into SQL strings

---

# 7.10 File Upload Security

| Measure | Implementation |
|---------|---------------|
| File type validation | MIME type check (server-side) |
| Magic number verification | Check file header bytes |
| Max file size | 25 MB (configurable per category) |
| Malware scanning | ClamAV integration (future) |
| Storage | S3 with server-side encryption |
| Access | Pre-signed URLs with TTL (1 hour) |
| Filename sanitization | Strip path separators, random UUID prefix |
| Executable blocking | Block .exe, .bat, .sh, .jar, .vbs, .msi |

---

# 7.11 Encryption Strategy

## Data at Rest

| Layer | Method |
|-------|--------|
| Database (RDS) | AES-256, AWS-managed key (KMS) |
| S3 Documents | SSE-S3 (AES-256) |
| Backups | AES-256 encrypted |
| Redis | No sensitive data stored; AUTH password only |

## Data in Transit

- TLS 1.3 for all external communication
- Internal service communication via VPC
- Database connections: TLS with certificate validation
- Redis connections: TLS enabled (ElastiCache)

## Sensitive Data

| Data Type | Protection |
|-----------|------------|
| Passwords | bcrypt (cost 12) |
| Refresh tokens | SHA-256 hash in DB |
| JWT private key | AWS Secrets Manager |
| API keys for integrations | AES-256 encrypted at rest |
| PII (email, phone, address) | Encrypted at rest (column-level, future) |

---

# 7.12 Secrets Management

| Secret | Location | Rotation |
|--------|----------|----------|
| JWT Private Key | AWS Secrets Manager | 90 days |
| Database credentials | AWS Secrets Manager + .env (local) | 90 days |
| Redis password | AWS Secrets Manager + .env (local) | 90 days |
| S3 access keys | AWS IAM roles (no static keys) | — |
| SMTP credentials | AWS Secrets Manager | 90 days |
| VIN API key | AWS Secrets Manager + .env (local) | As needed |
| Encryption keys | AWS KMS (automatic) | Automatic |

## Local Development
- `.env` file with local secrets (never committed)
- `.env.example` with placeholder values (committed)
- Docker Compose uses `.env` file
- Pre-commit hook prevents `.env` commits

## Production
- Secrets injected via ECS task definitions
- Fargate containers pull from Secrets Manager at startup
- No secrets in environment variables visible to `/proc`
- Secrets rotated without downtime

---

# 7.13 Threat Modeling

## STRIDE Analysis

| Threat Type | Risk | Impact | Mitigation |
|-------------|------|--------|------------|
| **S**poofing Identity | Medium | High | JWT validation, password complexity, MFA-ready |
| **T**ampering with Data | High | Critical | Audit hash chain, input validation, immutability |
| **R**epudiation | Medium | Medium | Immutable audit logs with user attribution |
| **I**nformation Disclosure | High | Critical | TLS, encryption at rest, RBAC, field-level access control |
| **D**enial of Service | Medium | High | Rate limiting, WAF, auto-scaling, connection pooling |
| **E**levation of Privilege | High | Critical | RBAC at API gateway + service layer, principle of least privilege |

## Specific Threats

| Threat | Probability | Impact | Risk | Mitigation |
|--------|-------------|--------|------|------------|
| Stolen JWT token | Medium | High | High | Short expiry (15min), refresh rotation, RS256 |
| Brute force login | Low | High | Medium | Rate limit, account lockout, bcrypt |
| Insecure direct object reference | Low | High | Medium | BranchGuard, ownership validation |
| SQL injection via search | Low | Critical | Medium | Prisma parameterized queries |
| XSS via work order notes | Medium | Medium | Medium | Input sanitization, CSP headers |
| Insider data export | Medium | High | High | Audit logging, report restrictions, data loss prevention |
| API key leakage | Low | Critical | Medium | Secrets Manager, rotation, IAM roles |
| Session hijacking | Low | High | Medium | HTTPS-only, secure headers, token binding |

## Security Incident Response Plan

1. **Detection:** CloudWatch alarms, WAF logging, audit alerts
2. **Containment:** Revoke tokens, lock user, block IP via WAF
3. **Investigation:** Full audit log review, identify scope
4. **Remediation:** Rotate secrets, patch vulnerability, restore from backup if needed
5. **Notification:** Notify affected parties within 72 hours (GDPR compliance)
6. **Post-mortem:** Root cause analysis, preventive measures

---

*End of Phase 7 — Security Design*
