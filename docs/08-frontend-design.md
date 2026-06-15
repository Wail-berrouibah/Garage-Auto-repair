# Phase 8 — Frontend Design

## Platform: Mechanica
## Framework: Next.js 15 + React 19 + TailwindCSS + shadcn/ui
## Document Version: 1.0

---

# 8.1 Information Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MECHANICA — SITE MAP                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /login                                                          │
│  /forgot-password                                                │
│  /reset-password                                                 │
│                                                                  │
│  /app (Authenticated)                                            │
│  ├── /dashboard                     → KPIs, charts, activity    │
│  │                                                                  │
│  ├── /work-orders                   → Kanban board              │
│  │   ├── /:id                       → Work order detail          │
│  │   └── /new                       → Create work order          │
│  │                                                                  │
│  ├── /vehicles                      → Vehicle list               │
│  │   ├── /:id                       → Vehicle profile + history  │
│  │   └── /new                       → Register vehicle           │
│  │                                                                  │
│  ├── /customers                     → Customer list              │
│  │   ├── /:id                       → Customer profile           │
│  │   └── /new                       → New customer               │
│  │                                                                  │
│  ├── /mechanics                     → Mechanic list              │
│  │   └── /:id                       → Mechanic profile + metrics │
│  │                                                                  │
│  ├── /inventory                     → Stock items list           │
│  │   ├── /items/:id                 → Stock item detail          │
│  │   ├── /warehouses                → Warehouse management       │
│  │   ├── /movements                 → Stock movements            │
│  │   └── /low-stock                 → Reorder alerts             │
│  │                                                                  │
│  ├── /purchasing                    → Purchase orders list       │
│  │   ├── /purchase-orders/:id       → PO detail                  │
│  │   ├── /purchase-orders/new       → Create PO                  │
│  │   ├── /receiving                 → Goods receiving            │
│  │   └── /suppliers                 → Supplier list              │
│  │                                                                  │
│  ├── /services                      → Service catalog            │
│  │                                                                  │
│  ├── /invoices                      → Invoice list               │
│  │   ├── /:id                       → Invoice detail              │
│  │   └── /credit-notes/:id          → Credit note detail          │
│  │                                                                  │
│  ├── /payments                      → Payments list              │
│  │                                                                  │
│  ├── /qc                            → QC management              │
│  │   ├── /templates                 → Checklist templates        │
│  │   ├── /inspections/:id           → QC inspection             │
│  │   └── /blocked                   → Blocked deliveries         │
│  │                                                                  │
│  ├── /reports                       → Reports hub               │
│  │   ├── /financial                 → Financial reports          │
│  │   ├── /workshop                  → Workshop reports           │
│  │   ├── /mechanics                 → Mechanic reports           │
│  │   └── /inventory                 → Inventory reports          │
│  │                                                                  │
│  ├── /settings                      → Settings                   │
│  │   ├── /users                     → User management            │
│  │   ├── /roles                     → Role management            │
│  │   ├── /branches                  → Branch management          │
│  │   └── /general                   → General settings           │
│  │                                                                  │
│  └── /notifications                 → Notification center        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

# 8.2 Navigation Structure

## Sidebar Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo] Mechanica                [Branch ▲]   [🔔 3]  [👤 Carlos]   │
├──────────────┬──────────────────────────────────────────────────────┤
│  🔍 Search   │                                                      │
│              │                                                      │
│  📊 Dashboard│              MAIN CONTENT AREA                       │
│  🔧 Work     │                                                      │
│     Orders   │                                                      │
│  🚗 Vehicles │                                                      │
│  👥 Customers│                                                      │
│  🔧 Mechanics│                                                      │
│  📦 Inventory│                                                      │
│  🛒 Purchasing│                                                      │
│  ⚙️ Services  │                                                      │
│  📄 Invoices  │                                                      │
│  💳 Payments  │                                                      │
│  ✅ QC        │                                                      │
│  📈 Reports   │                                                      │
│  ⚙️ Settings   │                                                      │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
```

## Mobile Navigation (Bottom Tab Bar)

```
┌──────────────────────────────────────────────────────────────────────┐
│                           MAIN CONTENT                               │
│                                                                      │
│                                                                      │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  📊     🔧     📦     📄     ⚙️                                     │
│ Dash   Work   Inven  Invoic Setti                                   │
│ board  Orders tory   es     ngs                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 8.3 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                                        [7d] [30d] [90d]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐        │
│ │Active │ │Waiting│ │Revenue│ │Mech   │ │Avg    │ │QC Pass│        │
│ │WOs: 14│ │Parts 3│ │ $4,580 │ │Util   │ │Repair │ │ 92.3% │        │
│ │  ↑ 2  │ │  ↓ 1  │ │  ↑$320│ │78.5%  │ │3.2h   │ │↑ 1.8% │        │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘        │
│                                                                      │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐   │
│ │  Revenue Trend               │ │  WO Status Distribution      │   │
│ │  ┌──────────────────────┐    │ │  ┌──────────────────┐       │   │
│ │  │  ████████████        │    │ │  │ 🟠 IN_PROGRESS 5 │       │   │
│ │  │  ████████████████    │    │ │  │ 🟡 DIAGNOSED   3 │       │   │
│ │  │  ███████████████████ │    │ │  │ 🔵 OPEN        2 │       │   │
│ │  │  ██████████████████  │    │ │  │ 🔴 WAIT_PARTS  3 │       │   │
│ │  │  ████████████████    │    │ │  │ 🟢 COMPLETED   1 │       │   │
│ │  └──────────────────────┘    │ │  └──────────────────┘       │   │
│ │  Jan Feb Mar Apr May Jun     │ │                            │   │
│ └──────────────────────────────┘ └──────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────┐ ┌──────────────────────────────┐   │
│ │  Activity Feed               │ │  Quick Actions               │   │
│ │  ┌──────────────────────┐    │ │  ┌──────────────────────┐    │   │
│ │  │ 2m ago - WO-042 →    │    │ │  │ [New Work Order]    │    │   │
│ │  │   IN PROGRESS        │    │ │  │ [Check-In Vehicle]  │    │   │
│ │  │ 5m ago - Payment     │    │ │  │ [Receive Parts]     │    │   │
│ │  │   $211.14 received   │    │ │  │ [New Purchase Order]│    │   │
│ │  │ 12m ago - QC passed  │    │ │  │ [Quick Invoice]     │    │   │
│ │  │   WO-040             │    │ │  └──────────────────────┘    │   │
│ │  └──────────────────────┘    │  └──────────────────────────────┘   │
│ └──────────────────────────────┘                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 8.4 Work Order Kanban Board

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Work Orders                               [+ New] [Filter ▼] [Search] │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────┬────────┤
│  OPEN    │ DIAGNOSED│WAITING   │IN PROGR  │QUALITY   │ COMPLTD│DELIVERD│
│  (2)     │  (3)     │PARTS (3) │ESS (5)   │CHECK (1) │ (1)    │ (0)    │
├──────────┼──────────┼──────────┼──────────┼──────────┼────────┼────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌────┐ │        │
│ │WO-042│ │ │WO-040│ │ │WO-038│ │ │WO-035│ │ │WO-030│ │ │WO-02│ │        │
│ │John  │ │ │Jane  │ │ │Bob   │ │ │Alice │ │ │Mike  │ │ │8    │ │        │
│ │Honda │ │ │Toyota│ │ │Ford  │ │ │BMW   │ │ │Audi  │ │ │Jane │ │        │
│ │🔴HIGH│ │ │🟡MED │ │ │🔴HIGH│ │ │🟢LOW │ │ │🟡MED │ │ │🟢LOW│ │        │
│ │Carlos│ │ │Sarah │ │ │ ⏳3d  │ │ │David │ │ │       │ │ │     │ │        │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └────┘ │        │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │          │        │        │
│ │WO-043│ │ │WO-041│ │ │WO-039│ │ │WO-036│ │          │        │        │
│ │Sarah │ │ │Mike  │ │ │Alice │ │ │Bob   │ │          │        │        │
│ │Tesla │ │ │Chevy │ │ │Nissan│ │ │Honda │ │          │        │        │
│ │🟡MED │ │ │🟢LOW │ │ │🟡MED │ │ │🔴HIGH│ │          │        │        │
│ │Unass │ │ │Carlos│ │ │ ⏳1d  │ │ │Sarah │ │          │        │        │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │          │        │        │
└──────────┴──────────┴──────────┴──────────┴──────────┴────────┴────────┘
```

**Kanban Card Component:**
```
┌────────────────────────────────────┐
│ WO-042                  🔴 HIGH    │
│ ─────────────────────────────────  │
│ John Doe                           │
│ 2023 Honda Accord LX              │
│ ABC 1234                           │
│ ─────────────────────────────────  │
│ 👤 Carlos Mendez      ⏳ 2h 15m   │
│ 📦 Parts: 2 waiting               │
└────────────────────────────────────┘
```

---

# 8.5 Forms

## Work Order Creation Form

```
┌─────────────────────────────────────────────────────────────────────┐
│  New Work Order                                            [✕]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Customer ────────────────────────────────────────────────────────  │
│  [Search customer by name, phone, email...      ▼]  or [+ New]      │
│                                                                      │
│  Vehicle ─────────────────────────────────────────────────────────  │
│  [Search vehicle by VIN, plate...              ▼]  or [+ New]       │
│                                                                      │
│  Customer Complaint * ─────────────────────────────────────────────  │
│  [                                                                    │
│  │ Customer description of the issue...                              │
│  │                                                                    │
│  ─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Priority ────────────────  Promised Date ─────────────────────────  │
│  [ Normal       ▼]         [ 01/20/2024                     ]        │
│                                                                      │
│  Odometer ────────────────  Odometer Unit ─────────────────────────- │
│  [ 45000                    ]  [ mi ▼]                               │
│                                                                      │
│  Assign Mechanic ──────────────────────────────────────────────────  │
│  [ Select mechanic...                     ▼]                         │
│                                                                      │
│  Internal Notes ───────────────────────────────────────────────────  │
│  [                                                                    │
│  │ Optional internal notes...                                        │
│  │                                                                    │
│  ─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│               [ Cancel ]           [ Create Work Order ]             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Form Patterns

| Pattern | Implementation | Library |
|---------|---------------|---------|
| Form validation | Zod schemas + `useForm` resolver | React Hook Form + Zod |
| Auto-save | Debounced save on field blur | Custom hook |
| Search combobox | Async search with debounce | shadcn/ui Combobox |
| Dynamic fields | Add/remove labor/part lines | useFieldArray |
| Image upload | Drag-and-drop zone | shadcn/ui Dropzone |
| Rich text | Simple textarea (no rich text v1) | shadcn/ui Textarea |
| Date picker | Calendar popover | shadcn/ui DatePicker |
| Status select | Status-specific color-coded badge | shadcn/ui Badge |

---

# 8.6 Tables

## Data Table Pattern (shadcn/ui DataTable)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Invoices                          [Filter ▼] [Export] [+ New Invoice]   │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Invoice # │ Customer     │ Date      │ Total   │ Status    │ Due  │  │
│  ├────────────────────────────────────────────────────────────────────┤  │
│  │ INV-00142 │ John Doe     │ 01/15/24  │ $211.14 │ PAID      │ —    │  │
│  │ INV-00141 │ Jane Smith   │ 01/14/24  │ $1,250  │ ISSUED    │ +5d  │  │
│  │ INV-00140 │ Bob Johnson  │ 01/13/24  │ $89.99  │ PARTIALLY │ +6d  │  │
│  │ ...        │              │           │         │ PAID      │      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Showing 1-25 of 142                                [<] [1] [2] [3] [>] │
└──────────────────────────────────────────────────────────────────────────┘
```

**Table Features:**
- Column sorting (click header)
- Column visibility toggle
- Row click → detail page
- Multi-select for bulk actions
- Responsive: horizontal scroll on mobile, stacked cards on very small screens
- Search within table results
- Export visible rows to CSV

---

# 8.7 Modals

## Confirmation Modal

```
┌────────────────────────────────────────┐
│  Confirm Status Change               │
├────────────────────────────────────────┤
│                                        │
│  Change WO-042 status to               │
│  DIAGNOSED?                            │
│                                        │
│  Reason (optional):                    │
│  [Diagnosis complete, waiting          │
│  for customer approval                 │
│                                        │
│  ┌──────┐   ┌──────────────────┐      │
│  │Cancel│   │ Confirm Change   │      │
│  └──────┘   └──────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

## QC Inspection Modal

```
┌────────────────────────────────────────────────────────────────────────┐
│  Quality Check — WO-030                           Inspector: Carlos    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ Check #1: Verify oil drain plug is torqued to spec    ✅ PASS  │   │
│  │ Notes: [Tightened to 30 ft-lbs]                                │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ Check #2: Verify oil filter is hand-tight + 1/4 turn  ❌ FAIL  │   │
│  │ Notes: [Filter was cross-threaded, replaced]                   │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │ Check #3: Check for oil leaks after start-up          ❓ PENDING│   │
│  │ Notes: []                                                      │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  Overall: [No defects found — PASS]                                    │
│                                                                        │
│  ┌──────────────┐   ┌────────────────────────────┐                    │
│  │ Save Draft   │   │ Complete Inspection        │                    │
│  └──────────────┘   └────────────────────────────┘                    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 8.8 Component Hierarchy

```
App
├── Providers
│   ├── QueryClientProvider (React Query)
│   ├── ThemeProvider (dark/light mode)
│   ├── AuthProvider (Zustand store)
│   ├── BranchProvider (Zustand store)
│   └── NotificationProvider
│
├── Layout
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── SearchCommand (⌘K)
│   │   ├── NavItem (repeated)
│   │   │   ├── Icon
│   │   │   ├── Label
│   │   │   └── Badge (count)
│   │   └── BranchSwitcher
│   │
│   ├── Header
│   │   ├── Breadcrumb
│   │   ├── NotificationBell
│   │   │   └── Badge (unread count)
│   │   ├── ThemeToggle
│   │   └── UserMenu
│   │       ├── Avatar
│   │       ├── Profile
│   │       ├── Settings
│   │       └── Logout
│   │
│   └── MainContent
│       └── [Page Content]
│
├── Pages (by route)
│   ├── DashboardPage
│   │   ├── KpiCardGrid
│   │   │   └── KpiCard (x6)
│   │   │       ├── Icon
│   │   │       ├── Value
│   │   │       ├── Label
│   │   │       └── TrendIndicator
│   │   ├── ChartGrid
│   │   │   ├── RevenueChart (Recharts Line)
│   │   │   └── WoStatusChart (Recharts Donut)
│   │   ├── ActivityFeed
│   │   │   └── ActivityItem (repeated)
│   │   └── QuickActions
│   │       └── ActionButton (x5)
│   │
│   ├── WorkOrdersPage
│   │   ├── KanbanBoard
│   │   │   ├── KanbanColumn (x7)
│   │   │   │   ├── ColumnHeader (status name + count)
│   │   │   │   └── WoCard (draggable)
│   │   │   │       ├── PriorityBadge
│   │   │   │       ├── VehicleInfo
│   │   │   │       ├── MechanicAvatar
│   │   │   │       └── TimeInStatus
│   │   │   └── DroppableZone (dnd-kit)
│   │   ├── WorkOrderDetail
│   │   │   ├── WoHeader (status, number, priority)
│   │   │   ├── CustomerVehicleInfo
│   │   │   ├── StatusTimeline
│   │   │   ├── LaborSection
│   │   │   │   └── LaborRow (editable)
│   │   │   ├── PartsSection
│   │   │   │   └── PartRow (editable)
│   │   │   ├── TimeTracking
│   │   │   │   └── TimeEntryRow
│   │   │   ├── NotesSection
│   │   │   │   └── NoteCard
│   │   │   └── AttachmentsSection
│   │   │       └── AttachmentThumbnail
│   │   └── WorkOrderForm (create/edit)
│   │
│   ├── InventoryPage
│   │   ├── StockItemTable (DataTable)
│   │   ├── StockItemDetail
│   │   │   ├── StockInfo
│   │   │   ├── BatchList
│   │   │   ├── MovementHistory
│   │   │   └── AdjustForm
│   │   ├── WarehouseList
│   │   │   └── WarehouseCard
│   │   └── LowStockAlert
│   │       └── LowStockItem
│   │
│   ├── InvoicesPage
│   │   ├── InvoiceTable (DataTable)
│   │   ├── InvoiceDetail
│   │   │   ├── InvoiceHeader
│   │   │   ├── InvoiceLines
│   │   │   ├── TaxSummary
│   │   │   ├── PaymentSummary
│   │   │   └── Actions (PDF, credit note, record payment)
│   │   └── InvoiceForm
│   │
│   └── SettingsPage
│       ├── UserManagement
│       │   └── UserTable (DataTable)
│       ├── RoleManagement
│       │   └── PermissionMatrix
│       ├── BranchManagement
│       │   └── BranchCard
│       └── GeneralSettings
│
└── Shared Components
    ├── ui/ (shadcn/ui primitives)
    │   ├── Button, Input, Select, Checkbox, RadioGroup
    │   ├── Dialog, Sheet, Popover, DropdownMenu
    │   ├── Table, Pagination, Command
    │   ├── Card, Badge, Avatar, Tabs
    │   ├── Calendar, DatePicker
    │   ├── Toast, Sonner
    │   └── Skeleton (loading states)
    ├── DataTable (generic reusable table)
    ├── PageHeader (title + actions)
    ├── SearchInput
    ├── ConfirmDialog
    ├── EmptyState
    ├── ErrorBoundary
    ├── LoadingSpinner
    └── BranchGuard (conditional render based on branch)
```

---

# 8.9 Mobile Responsiveness

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | Bottom tab nav, single column, stacked cards |
| Tablet | 640-1024px | Collapsed sidebar, 2-column grid |
| Desktop | > 1024px | Full sidebar, multi-column |

## Mobile Adaptations

| Desktop | Mobile |
|---------|--------|
| Sidebar | Bottom tab bar (5 tabs) |
| Kanban horizontal columns | Kanban horizontal swipe |
| DataTable with columns | Card list (stacked) |
| Side-by-side charts | Stacked charts |
| Inline editing | Modal/sheet editing |
| Multi-select checkboxes | Long-press selection |

---

# 8.10 Dark Mode

- Implemented via TailwindCSS `darkMode: 'class'` strategy
- Toggle stored in Zustand (`useThemeStore`)
- Persisted to localStorage
- System preference detection on first visit
- All shadcn/ui components support dark mode natively
- Custom components follow dark mode via `dark:` prefix classes

---

# 8.11 Theme Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { /* shadcn/ui default */ },
        sidebar: {
          bg: 'hsl(var(--sidebar-bg))',
          fg: 'hsl(var(--sidebar-fg))',
        },
        // Status colors
        'wo-open': 'hsl(var(--wo-open))',
        'wo-diagnosed': 'hsl(var(--wo-diagnosed))',
        'wo-waiting-parts': 'hsl(var(--wo-waiting-parts))',
        'wo-in-progress': 'hsl(var(--wo-in-progress))',
        'wo-quality-check': 'hsl(var(--wo-quality-check))',
        'wo-completed': 'hsl(var(--wo-completed))',
        'wo-delivered': 'hsl(var(--wo-delivered))',
        // Priority colors
        'priority-low': 'hsl(var(--priority-low))',
        'priority-normal': 'hsl(var(--priority-normal))',
        'priority-high': 'hsl(var(--priority-high))',
        'priority-urgent': 'hsl(var(--priority-urgent))',
      },
    },
  },
};
```

---

# 8.12 State Management Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                    MECHANICA STATE MANAGEMENT                          │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  SERVER STATE (React Query)                                     │   │
│  │                                                                  │   │
│  │  - All API data: work orders, customers, vehicles, inventory     │   │
│  │  - Automatic caching, refetching, optimistic updates             │   │
│  │  - Mutations via useMutation with invalidation                   │   │
│  │  - Infinite queries for paginated lists                          │   │
│  │  - Prefetching for detail pages                                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  CLIENT STATE (Zustand)                                         │   │
│  │                                                                  │   │
│  │  Stores:                                                         │   │
│  │  - useAuthStore: user, tokens, isAuthenticated                   │   │
│  │  - useBranchStore: selectedBranch, branches                      │   │
│  │  - useThemeStore: theme (dark/light), sidebar state              │   │
│  │  - useNotificationStore: unread count, notification list         │   │
│  │  - useUIStore: modals, toasts, loading overlays                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FORM STATE (React Hook Form)                                   │   │
│  │                                                                  │   │
│  │  - All forms use useForm with Zod resolver                      │   │
│  │  - Field-level validation on blur                                │   │
│  │  - Form-level validation on submit                               │   │
│  │  - useFieldArray for dynamic lists (labor/parts lines)          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

# 8.13 Accessibility

| Standard | Target | Implementation |
|----------|--------|----------------|
| WCAG 2.1 | Level AA | — |
| Keyboard navigation | All interactive elements | Tab, Enter, Escape, Arrow keys |
| Focus indicators | Visible focus ring | `focus-visible:ring-2` |
| Screen readers | ARIA labels on all interactive elements | `aria-label`, `role`, `aria-describedby` |
| Color contrast | 4.5:1 for text, 3:1 for large text | Checked via design tokens |
| Form errors | Announced to screen readers | `aria-invalid`, `aria-errormessage` |
| Modal focus trap | Focus locked within modal | shadcn/ui Dialog handles this |
| Skip to content | Link at top of page | `SkipToContent` component |
| Reduced motion | Respect `prefers-reduced-motion` | TailwindCSS `motion-reduce:` |

---

*End of Phase 8 — Frontend Design*
