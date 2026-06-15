export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  DASHBOARD_EXPORT: 'dashboard:export',

  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_EXPORT: 'customers:export',

  VEHICLES_CREATE: 'vehicles:create',
  VEHICLES_READ: 'vehicles:read',
  VEHICLES_UPDATE: 'vehicles:update',
  VEHICLES_DELETE: 'vehicles:delete',
  VEHICLES_EXPORT: 'vehicles:export',
  VEHICLES_DECODE_VIN: 'vehicles:decode-vin',

  WORK_ORDERS_CREATE: 'work_orders:create',
  WORK_ORDERS_READ: 'work_orders:read',
  WORK_ORDERS_UPDATE: 'work_orders:update',
  WORK_ORDERS_DELETE: 'work_orders:delete',
  WORK_ORDERS_CHANGE_STATUS: 'work_orders:change-status',
  WORK_ORDERS_ASSIGN: 'work_orders:assign',
  WORK_ORDERS_EXPORT: 'work_orders:export',

  LABOR_ENTRIES_CREATE: 'labor_entries:create',
  LABOR_ENTRIES_READ: 'labor_entries:read',
  LABOR_ENTRIES_UPDATE: 'labor_entries:update',
  LABOR_ENTRIES_DELETE: 'labor_entries:delete',

  PART_ENTRIES_CREATE: 'part_entries:create',
  PART_ENTRIES_READ: 'part_entries:read',
  PART_ENTRIES_UPDATE: 'part_entries:update',
  PART_ENTRIES_DELETE: 'part_entries:delete',

  TIME_ENTRIES_CREATE: 'time_entries:create',
  TIME_ENTRIES_READ: 'time_entries:read',
  TIME_ENTRIES_UPDATE: 'time_entries:update',
  TIME_ENTRIES_DELETE: 'time_entries:delete',

  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_UPDATE: 'inventory:update',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_EXPORT: 'inventory:export',

  PURCHASE_ORDERS_CREATE: 'purchase_orders:create',
  PURCHASE_ORDERS_READ: 'purchase_orders:read',
  PURCHASE_ORDERS_UPDATE: 'purchase_orders:update',
  PURCHASE_ORDERS_DELETE: 'purchase_orders:delete',
  PURCHASE_ORDERS_APPROVE: 'purchase_orders:approve',
  PURCHASE_ORDERS_RECEIVE: 'purchase_orders:receive',

  INVOICES_CREATE: 'invoices:create',
  INVOICES_READ: 'invoices:read',
  INVOICES_UPDATE: 'invoices:update',
  INVOICES_DELETE: 'invoices:delete',
  INVOICES_CHANGE_STATUS: 'invoices:change-status',
  INVOICES_EXPORT: 'invoices:export',
  INVOICES_GENERATE_PDF: 'invoices:generate-pdf',

  PAYMENTS_CREATE: 'payments:create',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_REFUND: 'payments:refund',

  QC_TEMPLATES_CREATE: 'qc_templates:create',
  QC_TEMPLATES_READ: 'qc_templates:read',
  QC_TEMPLATES_UPDATE: 'qc_templates:update',
  QC_INSPECTIONS_CREATE: 'qc_inspections:create',
  QC_INSPECTIONS_READ: 'qc_inspections:read',
  QC_INSPECTIONS_PERFORM: 'qc_inspections:perform',

  REPORTS_VIEW_FINANCIAL: 'reports:view-financial',
  REPORTS_VIEW_WORKSHOP: 'reports:view-workshop',
  REPORTS_VIEW_MECHANIC: 'reports:view-mechanic',
  REPORTS_VIEW_INVENTORY: 'reports:view-inventory',
  REPORTS_EXPORT: 'reports:export',

  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',

  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  BRANCHES_CREATE: 'branches:create',
  BRANCHES_READ: 'branches:read',
  BRANCHES_UPDATE: 'branches:update',

  AUDIT_LOGS_READ: 'audit_logs:read',
  AUDIT_LOGS_EXPORT: 'audit_logs:export',
  AUDIT_LOGS_VERIFY: 'audit_logs:verify',

  TRANSFERS_CREATE: 'transfers:create',
  TRANSFERS_READ: 'transfers:read',
  TRANSFERS_APPROVE: 'transfers:approve',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
