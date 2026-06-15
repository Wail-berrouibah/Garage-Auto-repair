import { PrismaClient, WoStatus, Priority, CustomerType, RoleName, PoStatus, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  const passwordHash = await bcrypt.hash('admin123', 12);

  // ==================== BRANCH ====================
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      code: 'HQ',
      name: 'Main Branch',
      addressLine1: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      phone: '+1-555-0100',
      email: 'branch@mechanica.com',
    },
  });
  console.log(`  Branch: ${branch.name}`);

  // ==================== ROLES ====================
  const roleNames: RoleName[] = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC', 'ACCOUNTANT', 'INVENTORY_MANAGER'];
  const roles: Record<string, any> = {};
  for (const name of roleNames) {
    roles[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, isSystem: true },
    });
  }
  console.log(`  Roles: ${Object.keys(roles).join(', ')}`);

  // ==================== USERS ====================
  const usersData = [
    { email: 'admin@mechanica.com', firstName: 'Admin', lastName: 'User', role: 'OWNER' },
    { email: 'manager@mechanica.com', firstName: 'Sarah', lastName: 'Johnson', role: 'MANAGER' },
    { email: 'reception@mechanica.com', firstName: 'Mike', lastName: 'Wilson', role: 'RECEPTIONIST' },
    { email: 'mechanic1@mechanica.com', firstName: 'Tom', lastName: 'Miller', role: 'MECHANIC' },
    { email: 'mechanic2@mechanica.com', firstName: 'James', lastName: 'Brown', role: 'MECHANIC' },
    { email: 'accountant@mechanica.com', firstName: 'Lisa', lastName: 'Davis', role: 'ACCOUNTANT' },
    { email: 'inventory@mechanica.com', firstName: 'Bob', lastName: 'Garcia', role: 'INVENTORY_MANAGER' },
  ];

  const users: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: { create: { roleId: roles[u.role].id } },
        branchAssignments: { create: { branchId: branch.id, isPrimary: true } },
      },
    });
    users.push(user);
  }
  console.log(`  Users: ${users.length} created`);

  const [admin, manager, receptionist, mechanic1, mechanic2, accountant, inventoryManager] = users;

  // ==================== CUSTOMERS ====================
  const customersData = [
    { customerType: 'INDIVIDUAL' as CustomerType, firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '+1-555-1001', city: 'New York', state: 'NY' },
    { customerType: 'INDIVIDUAL' as CustomerType, firstName: 'Emily', lastName: 'Clark', email: 'emily.clark@email.com', phone: '+1-555-1002', city: 'Brooklyn', state: 'NY' },
    { customerType: 'COMPANY' as CustomerType, firstName: 'Robert', lastName: 'Taylor', companyName: 'Taylor Transport LLC', email: 'rtaylor@taylortransport.com', phone: '+1-555-1003', city: 'New York', state: 'NY' },
    { customerType: 'INDIVIDUAL' as CustomerType, firstName: 'Maria', lastName: 'Gonzalez', email: 'maria.g@email.com', phone: '+1-555-1004', city: 'Queens', state: 'NY' },
    { customerType: 'COMPANY' as CustomerType, firstName: 'David', lastName: 'Kim', companyName: 'Swift Delivery Co', email: 'dkim@swiftdelivery.com', phone: '+1-555-1005', city: 'Manhattan', state: 'NY' },
    { customerType: 'INDIVIDUAL' as CustomerType, firstName: 'Jennifer', lastName: 'Lee', email: 'jennifer.lee@email.com', phone: '+1-555-1006', city: 'Bronx', state: 'NY' },
    { customerType: 'INDIVIDUAL' as CustomerType, firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@email.com', phone: '+1-555-1007', city: 'New York', state: 'NY' },
    { customerType: 'COMPANY' as CustomerType, firstName: 'Patricia', lastName: 'Martinez', companyName: 'Martinez Fleet Services', email: 'pmartinez@martinezfleet.com', phone: '+1-555-1008', city: 'New York', state: 'NY' },
  ];

  const customers: any[] = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: { branchId: branch.id, ...c, tags: [] },
    });
    customers.push(customer);
  }
  console.log(`  Customers: ${customers.length} created`);

  // ==================== VEHICLES ====================
  const vehiclesData = [
    { vin: '1HGCM82633A004352', licensePlate: 'ABC-1234', make: 'Honda', model: 'Accord', year: 2020, color: 'Silver' },
    { vin: '1FAFP404X1F200165', licensePlate: 'XYZ-5678', make: 'Ford', model: 'Focus', year: 2019, color: 'Blue' },
    { vin: '1G1BL52P7TR115520', licensePlate: 'DEF-9012', make: 'Chevrolet', model: 'Malibu', year: 2021, color: 'White' },
    { vin: 'JTEBU5JR0A5089726', licensePlate: 'GHI-3456', make: 'Toyota', model: '4Runner', year: 2022, color: 'Black' },
    { vin: '5NPEB4AC9DH591852', licensePlate: 'JKL-7890', make: 'Hyundai', model: 'Sonata', year: 2020, color: 'Red' },
    { vin: 'WAUZZZ8V7LA123456', licensePlate: 'MNO-2345', make: 'Audi', model: 'A4', year: 2023, color: 'Gray' },
    { vin: '1FTFW1ET9BFA12345', licensePlate: 'PQR-6789', make: 'Ford', model: 'F-150', year: 2021, color: 'Green' },
    { vin: 'WBA3A5C5XDF123456', licensePlate: 'STU-0123', make: 'BMW', model: '3 Series', year: 2022, color: 'Navy' },
    { vin: '3N1AB7AP9FY345678', licensePlate: 'VWX-4567', make: 'Nissan', model: 'Altima', year: 2023, color: 'Silver' },
    { vin: '2C3CDXBG9KH567890', licensePlate: 'YZA-8901', make: 'Chrysler', model: '300', year: 2020, color: 'Black' },
  ];

  const vehicles: any[] = [];
  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.create({
      data: { branchId: branch.id, ...v, odometer: 25000 + Math.floor(Math.random() * 50000) },
    });
    vehicles.push(vehicle);
  }
  console.log(`  Vehicles: ${vehicles.length} created`);

  // ==================== CUSTOMER-VEHICLE ASSIGNMENTS ====================
  const assignments = [
    { customerIdx: 0, vehicleIdx: 0, isPrimary: true },
    { customerIdx: 1, vehicleIdx: 1, isPrimary: true },
    { customerIdx: 2, vehicleIdx: 2, isPrimary: true },
    { customerIdx: 3, vehicleIdx: 3, isPrimary: true },
    { customerIdx: 4, vehicleIdx: 4, isPrimary: true },
    { customerIdx: 5, vehicleIdx: 5, isPrimary: true },
    { customerIdx: 6, vehicleIdx: 6, isPrimary: true },
    { customerIdx: 7, vehicleIdx: 7, isPrimary: true },
    { customerIdx: 2, vehicleIdx: 8, isPrimary: false },
    { customerIdx: 4, vehicleIdx: 9, isPrimary: false },
  ];

  for (const a of assignments) {
    await prisma.customerVehicle.create({
      data: {
        customerId: customers[a.customerIdx].id,
        vehicleId: vehicles[a.vehicleIdx].id,
        isPrimary: a.isPrimary,
        relationship: 'OWNER',
      },
    });
  }
  console.log(`  Vehicle assignments: ${assignments.length} created`);

  // ==================== SERVICES CATALOG ====================
  const servicesData = [
    { code: 'OIL_CHG', name: 'Oil Change', category: 'MAINTENANCE', defaultRate: 49.99, estimatedHours: 0.5 },
    { code: 'TIRE_ROT', name: 'Tire Rotation', category: 'MAINTENANCE', defaultRate: 29.99, estimatedHours: 0.5 },
    { code: 'BRAKE_INSP', name: 'Brake Inspection', category: 'INSPECTION', defaultRate: 39.99, estimatedHours: 1.0 },
    { code: 'BRAKE_REPL', name: 'Brake Pad Replacement', category: 'REPAIR', defaultRate: 199.99, estimatedHours: 2.0 },
    { code: 'ENG_DIAG', name: 'Engine Diagnostic', category: 'DIAGNOSTIC', defaultRate: 129.99, estimatedHours: 1.5 },
    { code: 'AC_SVC', name: 'AC Service', category: 'REPAIR', defaultRate: 149.99, estimatedHours: 2.0 },
    { code: 'TRANS_FLUSH', name: 'Transmission Flush', category: 'MAINTENANCE', defaultRate: 179.99, estimatedHours: 1.5 },
    { code: 'COOLANT_FLUSH', name: 'Coolant Flush', category: 'MAINTENANCE', defaultRate: 99.99, estimatedHours: 1.0 },
    { code: 'BATT_REPL', name: 'Battery Replacement', category: 'REPAIR', defaultRate: 89.99, estimatedHours: 0.5 },
    { code: 'ALIGNMENT', name: 'Wheel Alignment', category: 'MAINTENANCE', defaultRate: 89.99, estimatedHours: 1.0 },
  ];

  const services: any[] = [];
  for (const s of servicesData) {
    const service = await prisma.service.create({
      data: { branchId: branch.id, ...s },
    });
    services.push(service);
  }
  console.log(`  Services: ${services.length} created`);

  // ==================== WORK ORDERS ====================
  const workOrdersData = [
    { customerIdx: 0, vehicleIdx: 0, status: 'IN_PROGRESS' as WoStatus, priority: 'NORMAL' as Priority, complaint: 'Engine making knocking noise', diagnosis: 'Low oil level detected, engine wear suspected', assignedToIdx: 3 },
    { customerIdx: 1, vehicleIdx: 1, status: 'QUALITY_CHECK' as WoStatus, priority: 'NORMAL' as Priority, complaint: 'Brake pads worn out, squeaking when braking', diagnosis: 'Front brake pads worn to 2mm, rotors warped', assignedToIdx: 4 },
    { customerIdx: 2, vehicleIdx: 2, status: 'OPEN' as WoStatus, priority: 'HIGH' as Priority, complaint: 'Check engine light on, rough idle', diagnosis: null, assignedToIdx: null },
    { customerIdx: 3, vehicleIdx: 3, status: 'COMPLETED' as WoStatus, priority: 'NORMAL' as Priority, complaint: 'AC not blowing cold air', diagnosis: 'Low refrigerant level, minor leak at condenser', assignedToIdx: 3 },
    { customerIdx: 4, vehicleIdx: 4, status: 'DIAGNOSED' as WoStatus, priority: 'URGENT' as Priority, complaint: 'Transmission slipping between gears', diagnosis: 'Transmission fluid burnt, clutch pack worn', assignedToIdx: 4 },
    { customerIdx: 5, vehicleIdx: 5, status: 'OPEN' as WoStatus, priority: 'LOW' as Priority, complaint: 'Regular oil change and tire rotation', diagnosis: null, assignedToIdx: null },
    { customerIdx: 6, vehicleIdx: 6, status: 'WAITING_PARTS' as WoStatus, priority: 'HIGH' as Priority, complaint: 'Battery dead, wont start', diagnosis: 'Battery failed load test, needs replacement', assignedToIdx: 3 },
    { customerIdx: 7, vehicleIdx: 7, status: 'IN_PROGRESS' as WoStatus, priority: 'NORMAL' as Priority, complaint: 'Coolant leak under vehicle', diagnosis: 'Radiator hose cracked, coolant reservoir low', assignedToIdx: 4 },
  ];

  const workOrders: any[] = [];
  for (let i = 0; i < workOrdersData.length; i++) {
    const wo = workOrdersData[i];
    const woNumber = `WO-${String(i + 1).padStart(4, '0')}`;
    const workOrder = await prisma.workOrder.create({
      data: {
        branchId: branch.id,
        woNumber,
        customerId: customers[wo.customerIdx].id,
        vehicleId: vehicles[wo.vehicleIdx].id,
        status: wo.status,
        priority: wo.priority,
        complaint: wo.complaint,
        diagnosis: wo.diagnosis,
        assignedTo: wo.assignedToIdx !== null ? users[wo.assignedToIdx].id : null,
        odometerIn: 30000 + Math.floor(Math.random() * 40000),
      },
    });
    workOrders.push(workOrder);

    // Create initial status history
    await prisma.woStatusHistory.create({
      data: {
        workOrderId: workOrder.id,
        fromStatus: null,
        toStatus: wo.status,
        changedBy: admin.id,
        reason: 'Initial status',
      },
    });
  }
  console.log(`  Work Orders: ${workOrders.length} created`);

  // ==================== LABOR & PARTS FOR WORK ORDERS ====================
  // Labor entries for IN_PROGRESS, QUALITY_CHECK, COMPLETED work orders
  const laborEntriesData = [
    { woIdx: 0, serviceIdx: 4, mechanicIdx: 3, actualHours: 1.5, description: 'Engine diagnostic and oil top-up' },
    { woIdx: 1, serviceIdx: 2, mechanicIdx: 4, actualHours: 1.0, description: 'Brake inspection' },
    { woIdx: 1, serviceIdx: 3, mechanicIdx: 4, actualHours: 2.0, description: 'Brake pad replacement' },
    { woIdx: 3, serviceIdx: 5, mechanicIdx: 3, actualHours: 2.0, description: 'AC service and recharge' },
    { woIdx: 4, serviceIdx: 6, mechanicIdx: 4, actualHours: 1.0, description: 'Transmission diagnostic' },
    { woIdx: 7, serviceIdx: 7, mechanicIdx: 4, actualHours: 1.0, description: 'Coolant flush and hose replacement' },
  ];

  for (const le of laborEntriesData) {
    const wo = workOrders[le.woIdx];
    const svc = services[le.serviceIdx];
    const mech = users[le.mechanicIdx];
    const estimatedHours = Number(svc.estimatedHours);
    const rate = Number(svc.defaultRate);
    const actualHours = le.actualHours;
    const lineTotal = actualHours * rate;

    await prisma.laborEntry.create({
      data: {
        workOrderId: wo.id,
        serviceId: svc.id,
        mechanicId: mech.id,
        description: le.description,
        estimatedHours,
        actualHours,
        rate,
        rateUnit: 'HOURLY',
        lineTotal,
      },
    });
  }
  console.log(`  Labor entries: ${laborEntriesData.length} created`);

  // ==================== WAREHOUSE & INVENTORY ====================
  const warehouse = await prisma.warehouse.create({
    data: {
      branchId: branch.id,
      name: 'Main Warehouse',
      code: 'MAIN',
    },
  });

  const stockItemsData = [
    { sku: 'OIL-5W30-1G', name: 'Engine Oil 5W-30 (1 Gal)', category: 'OILS_FLUIDS', brand: 'Mobil 1', unitCost: 24.99, sellingPrice: 39.99, quantityOnHand: 50, reorderPoint: 10, reorderQuantity: 25 },
    { sku: 'OIL-10W40-1G', name: 'Engine Oil 10W-40 (1 Gal)', category: 'OILS_FLUIDS', brand: 'Castrol', unitCost: 22.99, sellingPrice: 37.99, quantityOnHand: 30, reorderPoint: 10, reorderQuantity: 20 },
    { sku: 'FILTER-OIL', name: 'Oil Filter', category: 'FILTERS', brand: 'Fram', unitCost: 5.99, sellingPrice: 12.99, quantityOnHand: 100, reorderPoint: 20, reorderQuantity: 50 },
    { sku: 'FILTER-AIR', name: 'Air Filter', category: 'FILTERS', brand: 'K&N', unitCost: 8.99, sellingPrice: 19.99, quantityOnHand: 60, reorderPoint: 15, reorderQuantity: 30 },
    { sku: 'BRAKE-PAD-FRONT', name: 'Front Brake Pads', category: 'BRAKES', brand: 'Bosch', unitCost: 35.99, sellingPrice: 69.99, quantityOnHand: 40, reorderPoint: 10, reorderQuantity: 20 },
    { sku: 'BRAKE-PAD-REAR', name: 'Rear Brake Pads', category: 'BRAKES', brand: 'Bosch', unitCost: 32.99, sellingPrice: 64.99, quantityOnHand: 35, reorderPoint: 10, reorderQuantity: 20 },
    { sku: 'BATTERY-GRP48', name: 'Battery Group 48', category: 'ELECTRICAL', brand: 'Optima', unitCost: 89.99, sellingPrice: 169.99, quantityOnHand: 20, reorderPoint: 5, reorderQuantity: 10 },
    { sku: 'COOLANT-1G', name: 'Antifreeze/Coolant (1 Gal)', category: 'OILS_FLUIDS', brand: 'Prestone', unitCost: 11.99, sellingPrice: 19.99, quantityOnHand: 45, reorderPoint: 10, reorderQuantity: 20 },
    { sku: 'SPARK-PLUG', name: 'Spark Plug (per piece)', category: 'ELECTRICAL', brand: 'NGK', unitCost: 3.99, sellingPrice: 8.99, quantityOnHand: 200, reorderPoint: 50, reorderQuantity: 100 },
    { sku: 'TRANS-FLUID-1G', name: 'Transmission Fluid (1 Gal)', category: 'OILS_FLUIDS', brand: 'Valvoline', unitCost: 28.99, sellingPrice: 49.99, quantityOnHand: 25, reorderPoint: 8, reorderQuantity: 15 },
    { sku: 'WIPER-BLADE', name: 'Windshield Wiper Blade', category: 'ACCESSORIES', brand: 'Rain-X', unitCost: 6.99, sellingPrice: 14.99, quantityOnHand: 80, reorderPoint: 20, reorderQuantity: 40 },
    { sku: 'BELT-SERP', name: 'Serpentine Belt', category: 'ENGINE', brand: 'Gates', unitCost: 18.99, sellingPrice: 34.99, quantityOnHand: 30, reorderPoint: 10, reorderQuantity: 15 },
  ];

  const stockItems: any[] = [];
  for (const si of stockItemsData) {
    const item = await prisma.stockItem.create({
      data: { warehouseId: warehouse.id, ...si },
    });
    stockItems.push(item);
  }

  // Add stock movements for initial inventory
  for (const si of stockItems) {
    await prisma.stockMovement.create({
      data: {
        stockItemId: si.id,
        movementType: 'RECEIVING' as MovementType,
        quantity: Number(si.quantityOnHand),
        unitCost: Number(si.unitCost),
        notes: 'Initial stock',
        performedBy: inventoryManager.id,
      },
    });
  }
  console.log(`  Stock items: ${stockItems.length} created`);

  // ==================== SUPPLIER & PURCHASE ORDERS ====================
  const suppliersData = [
    { code: 'AUTOZONE', name: 'AutoZone Parts', contactPerson: 'Rick Johnson', email: 'orders@autozone.com', phone: '+1-800-555-2001', paymentTerms: 'NET30', leadTimeDays: 3 },
    { code: 'NAPA', name: 'NAPA Auto Parts', contactPerson: 'Susan Miller', email: 'supply@napa.com', phone: '+1-800-555-2002', paymentTerms: 'NET15', leadTimeDays: 2 },
    { code: 'OEMDIRECT', name: 'OEM Direct Supply', contactPerson: 'Kevin Park', email: 'sales@oemdirect.com', phone: '+1-800-555-2003', paymentTerms: 'NET30', leadTimeDays: 5 },
  ];

  const suppliers: any[] = [];
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.create({
      data: { branchId: branch.id, ...s },
    });
    suppliers.push(supplier);
  }
  console.log(`  Suppliers: ${suppliers.length} created`);

  // Purchase Orders
  const poData = [
    { supplierIdx: 0, status: 'RECEIVED' as PoStatus, lineItems: [
      { stockItemIdx: 0, qty: 12, unitPrice: 24.99 },
      { stockItemIdx: 2, qty: 24, unitPrice: 5.99 },
      { stockItemIdx: 6, qty: 5, unitPrice: 89.99 },
    ]},
    { supplierIdx: 1, status: 'SENT' as PoStatus, lineItems: [
      { stockItemIdx: 4, qty: 10, unitPrice: 35.99 },
      { stockItemIdx: 5, qty: 10, unitPrice: 32.99 },
      { stockItemIdx: 11, qty: 8, unitPrice: 18.99 },
    ]},
    { supplierIdx: 2, status: 'DRAFT' as PoStatus, lineItems: [
      { stockItemIdx: 3, qty: 20, unitPrice: 8.50 },
      { stockItemIdx: 8, qty: 50, unitPrice: 3.50 },
    ]},
  ];

  for (let i = 0; i < poData.length; i++) {
    const po = poData[i];
    const poNumber = `PO-${String(i + 1).padStart(4, '0')}`;
    const subtotal = po.lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0);

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        branchId: branch.id,
        poNumber,
        supplierId: suppliers[po.supplierIdx].id,
        status: po.status,
        subtotal,
        taxTotal: subtotal * 0.08,
        grandTotal: subtotal * 1.08,
        createdBy: inventoryManager.id,
        approvedBy: po.status === 'RECEIVED' || po.status === 'SENT' ? manager.id : null,
        orderDate: new Date(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        receivedDate: po.status === 'RECEIVED' ? new Date() : null,
      },
    });

    for (let j = 0; j < po.lineItems.length; j++) {
      const li = po.lineItems[j];
      await prisma.poLineItem.create({
        data: {
          purchaseOrderId: purchaseOrder.id,
          stockItemId: stockItems[li.stockItemIdx].id,
          lineNumber: j + 1,
          partNumber: stockItems[li.stockItemIdx].sku,
          description: stockItems[li.stockItemIdx].name,
          quantityOrdered: li.qty,
          quantityReceived: po.status === 'RECEIVED' ? li.qty : 0,
          unitPrice: li.unitPrice,
          lineTotal: li.qty * li.unitPrice,
        },
      });
    }
  }
  console.log(`  Purchase orders: ${poData.length} created`);

  // ==================== QUALITY CONTROL ====================
  const templatesData = [
    {
      name: 'Oil Change QC Checklist',
      serviceType: 'OIL_CHG',
      items: [
        'Verify correct oil grade and quantity used',
        'Check oil filter properly installed and sealed',
        'Check for oil leaks after fill',
        'Verify oil level on dipstick within range',
        'Reset oil life indicator if applicable',
        'Check drain plug torque and no leaks',
      ],
    },
    {
      name: 'Brake Service QC Checklist',
      serviceType: 'BRAKE_REPL',
      items: [
        'Verify brake pad thickness meets specification',
        'Check brake rotor condition and thickness',
        'Ensure caliper slide pins lubricated',
        'Verify brake fluid level topped off',
        'Check brake lines for leaks or damage',
        'Test brake pedal feel before road test',
        'Perform road test and verify no pulling/noise',
      ],
    },
    {
      name: 'General Inspection Checklist',
      serviceType: null,
      items: [
        'Vehicle interior clean and protected',
        'All tools and equipment removed from vehicle',
        'Hood and trunk properly closed',
        'Tire pressure checked and set to spec',
        'All fluid levels checked',
        'Lights and signals functional',
        'Test drive completed successfully',
      ],
    },
  ];

  const templates: any[] = [];
  for (const t of templatesData) {
    const template = await prisma.checklistTemplate.create({
      data: {
        branchId: branch.id,
        name: t.name,
        serviceType: t.serviceType,
        items: {
          create: t.items.map((desc, idx) => ({
            description: desc,
            isRequired: idx < 4,
            sortOrder: idx,
          })),
        },
      },
    });
    templates.push(template);
  }
  console.log(`  QC templates: ${templates.length} created`);

  // QC Inspections for completed/quality check work orders
  const inspectionData = [
    { woIdx: 3, templateIdx: 2, result: 'PASS', notes: 'All checks passed. Vehicle ready for delivery.' },
    { woIdx: 1, templateIdx: 1, result: 'PASS', notes: 'Brake service completed. Road test confirmed no issues.' },
  ];

  for (const ins of inspectionData) {
    const wo = workOrders[ins.woIdx];
    const template = templates[ins.templateIdx];

    const templateWithItems = await prisma.checklistTemplate.findUnique({
      where: { id: template.id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!templateWithItems) continue;

    const inspection = await prisma.qcInspectionResult.create({
      data: {
        workOrderId: wo.id,
        branchId: branch.id,
        checklistTemplateId: template.id,
        inspectorId: mechanic1.id,
        result: ins.result,
        notes: ins.notes,
      },
    });

    for (const item of templateWithItems.items) {
      await prisma.qcCheck.create({
        data: {
          qcResultId: inspection.id,
          checklistItemId: item.id,
          passed: true,
          notes: null,
        },
      });
    }
  }
  console.log(`  QC inspections: ${inspectionData.length} created`);

  // ==================== SUMMARY ====================
  console.log('\n=== Seed Complete ===');
  console.log('Login credentials (all passwords: admin123):');
  for (const u of users) {
    console.log(`  ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
