# Phase 9 — RBAC Matrix

## Platform: Mechanica
## Document Version: 1.0

---

# 9.1 Permission Model

## Format
`resource:action` e.g., `work_orders:create`

## Actions
| Action | Description |
|--------|-------------|
| `create` | Create new resource |
| `read` | View resource details |
| `update` | Modify existing resource |
| `delete` | Soft-delete resource |
| `approve` | Approve/reject (e.g., QC, POs) |
| `export` | Export to CSV/PDF/Excel |
| `manage` | Full administrative control |

## Scopes
| Scope | Description |
|-------|-------------|
| `GLOBAL` | All branches |
| `BRANCH` | Assigned branch(es) |
| `SELF` | Own data only (e.g., own work orders) |

---

# 9.2 Complete Permission Matrix

## Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Granted |
| ❌ | Denied |
| 👁️ | Read-only |
| 🔒 | Conditional (see notes) |

## Dashboard

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| dashboard | read | ✅GLOBAL | ✅BRANCH | ✅BRANCH | ✅BRANCH | ✅BRANCH | ✅BRANCH |
| dashboard | export | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## Customers

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| customers | create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| customers | read | ✅ | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| customers | update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| customers | delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| customers | export | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

## Vehicles

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| vehicles | create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| vehicles | read | ✅ | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| vehicles | update | ✅ | ✅ | ✅ | 👁️ | ❌ | ❌ |
| vehicles | delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| vehicles | export | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| vehicles | decode-vin | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

## Work Orders

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| work_orders | create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| work_orders | read | ✅ | ✅ | ✅ | 🔒SELF | 👁️ | 👁️ |
| work_orders | update | ✅ | ✅ | 👁️ | 🔒SELF | ❌ | ❌ |
| work_orders | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |
| work_orders | change-status | ✅ | ✅ | ❌ | 🔒 | ❌ | ❌ |
| work_orders | assign | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| work_orders | export | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

## Labor Entries

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| labor_entries | create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| labor_entries | read | ✅ | ✅ | ❌ | 🔒SELF | 👁️ | ❌ |
| labor_entries | update | ✅ | ✅ | ❌ | 🔒SELF | ❌ | ❌ |
| labor_entries | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |

## Part Entries

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| part_entries | create | ✅ | ✅ | ❌ | ✅ | ❌ | 🔒 |
| part_entries | read | ✅ | ✅ | ❌ | ✅ | 👁️ | ✅ |
| part_entries | update | ✅ | ✅ | ❌ | ❌ | ❌ | 🔒 |
| part_entries | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | 🔒 |

## Time Entries

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| time_entries | create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| time_entries | read | ✅ | ✅ | ❌ | 🔒SELF | 👁️ | ❌ |
| time_entries | update | ✅ | 🔒 | ❌ | 🔒SELF | ❌ | ❌ |
| time_entries | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |

## Inventory

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| stock_items | create | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| stock_items | read | ✅ | ✅ | ❌ | ✅ | 👁️ | ✅ |
| stock_items | update | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| stock_items | delete | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |
| stock_items | adjust | ✅ | 🔒 | ❌ | ❌ | ❌ | ✅ |
| stock_items | export | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

## Warehouses

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| warehouses | create | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |
| warehouses | read | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| warehouses | update | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |
| warehouses | delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Stock Movements

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| stock_movements | read | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ |
| stock_movements | export | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

## Suppliers

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| suppliers | create | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| suppliers | read | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ |
| suppliers | update | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| suppliers | delete | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |

## Purchase Orders

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| purchase_orders | create | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| purchase_orders | read | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ |
| purchase_orders | update | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| purchase_orders | delete | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |
| purchase_orders | approve | ✅ | ❌ | ❌ | ❌ | ❌ | 🔒 |
| purchase_orders | receive | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| purchase_orders | export | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |

## Services

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| services | create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| services | read | ✅ | ✅ | 👁️ | ✅ | 👁️ | ❌ |
| services | update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| services | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |

## Invoices

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| invoices | create | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| invoices | read | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ |
| invoices | update | ✅ | 🔒 | ❌ | ❌ | ✅ | ❌ |
| invoices | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |
| invoices | change-status | ✅ | 🔒 | ❌ | ❌ | 🔒 | ❌ |
| invoices | export | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| invoices | generate-pdf | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## Payments

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| payments | create | ✅ | ✅ | 🔒 | ❌ | ✅ | ❌ |
| payments | read | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| payments | refund | ✅ | 🔒 | ❌ | ❌ | 🔒 | ❌ |
| payments | export | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## Credit Notes

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| credit_notes | create | ✅ | 🔒 | ❌ | ❌ | ✅ | ❌ |
| credit_notes | read | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| credit_notes | approve | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Quality Control

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| qc_templates | create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| qc_templates | read | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ |
| qc_templates | update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| qc_templates | delete | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |
| qc_inspections | create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| qc_inspections | read | ✅ | ✅ | ❌ | 👁️ | ❌ | ❌ |
| qc_inspections | perform | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| qc_inspections | override | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |

## Reports

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| reports | view-financial | ✅GLOBAL | ✅BRANCH | ❌ | ❌ | ✅ | ❌ |
| reports | view-workshop | ✅ | ✅ | ❌ | 👁️ | 👁️ | ❌ |
| reports | view-mechanic | ✅GLOBAL | ✅BRANCH | ❌ | 🔒SELF | 👁️ | ❌ |
| reports | view-inventory | ✅ | ✅ | ❌ | ❌ | 👁️ | ✅ |
| reports | export | ✅ | ✅ | ❌ | ❌ | ✅ | 🔒 |

## Users

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| users | create | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |
| users | read | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users | update | ✅ | 🔒 | ❌ | ❌ | ❌ | ❌ |
| users | delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| users | manage-roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Roles & Permissions

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| roles | create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| roles | read | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| roles | update | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| roles | delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| permissions | manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Branches

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| branches | create | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| branches | read | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ |
| branches | update | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| branches | delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Transfers

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| transfers | create | ✅ | 🔒 | ❌ | ❌ | ❌ | ✅ |
| transfers | read | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| transfers | approve | ✅ | 🔒 | ❌ | ❌ | ❌ | 🔒 |
| transfers | receive | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Notifications

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| notifications | read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| notifications | mark-read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Audit Logs

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| audit_logs | read | ✅GLOBAL | ✅BRANCH | ❌ | ❌ | 👁️ | ❌ |
| audit_logs | export | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| audit_logs | verify | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Settings

| Resource | Action | Owner | Manager | Receptionist | Mechanic | Accountant | Inventory Mgr |
|----------|--------|-------|---------|-------------|----------|------------|---------------|
| settings | read-general | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| settings | update-general | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| settings | manage-integrations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

# 9.3 Permission Check Implementation

## Decorator-based enforcement (NestJS)

```typescript
// Controller-level
@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class WorkOrderController {
  
  @Post()
  @Permissions('work_orders:create')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  async create(@Body() dto: CreateWorkOrderDto) { ... }

  @Get(':id')
  @Permissions('work_orders:read')
  async findOne(@Param('id') id: string, @CurrentUser() user: UserContext) {
    // SELF scope check for MECHANIC role
    if (user.hasRole('MECHANIC') && !user.isSelfScope(id)) {
      throw new ForbiddenException();
    }
  }

  @Patch(':id/status')
  @Permissions('work_orders:change-status')
  @Roles('OWNER', 'MANAGER')
  async updateStatus(...) { ... }
}
```

---

# 9.4 Permission Data Model

```sql
-- Resource types (enum-like table)
INSERT INTO resources (name) VALUES 
  ('dashboard'), ('customers'), ('vehicles'), ('work_orders'),
  ('labor_entries'), ('part_entries'), ('time_entries'),
  ('inventory'), ('warehouses'), ('stock_movements'),
  ('suppliers'), ('purchase_orders'), ('services'),
  ('invoices'), ('payments'), ('credit_notes'),
  ('qc_templates'), ('qc_inspections'),
  ('reports'), ('users'), ('roles'), ('permissions'),
  ('branches'), ('transfers'),
  ('notifications'), ('audit_logs'), ('settings');

-- Default role-permission mapping (seeded on migration)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'OWNER'
  AND p.action IN ('create', 'read', 'update', 'delete', 'approve', 'export', 'manage');
```

---

*End of Phase 9 — RBAC Matrix*
