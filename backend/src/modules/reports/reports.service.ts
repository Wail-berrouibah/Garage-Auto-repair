import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFinancial(branchId: string, from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [revenueAgg, woCount, invoiceAgg, monthlyRevenue] = await Promise.all([
      this.prisma.workOrder.aggregate({
        where: { branchId, deletedAt: null, status: 'DELIVERED', ...dateFilter },
        _sum: { actualTotal: true },
        _avg: { actualTotal: true },
        _count: true,
      }),
      this.prisma.workOrder.count({
        where: { branchId, deletedAt: null, ...dateFilter },
      }),
      this.prisma.invoice.aggregate({
        where: { branchId, deletedAt: null, status: { not: 'CANCELLED' }, ...dateFilter },
        _sum: { total: true, amountPaid: true },
        _count: true,
      }),
      this.prisma.$queryRawUnsafe<Array<{ month: string; revenue: number }>>(
        `SELECT to_char("delivered_at", 'YYYY-MM') AS month,
                COALESCE(SUM("actual_total"), 0) AS revenue
         FROM work_orders
         WHERE branch_id = $1::uuid
           AND status = 'DELIVERED'
           AND deleted_at IS NULL
           ${from ? `AND "delivered_at" >= $2::timestamp` : ''}
           ${to ? `AND "delivered_at" <= ${from ? '$3::timestamp' : '$2::timestamp'}` : ''}
         GROUP BY month
         ORDER BY month ASC`,
        ...this.buildParams(branchId, from, to),
      ),
    ]);

    return {
      totalRevenue: Number(revenueAgg._sum.actualTotal ?? 0),
      averageRevenue: Number(revenueAgg._avg.actualTotal ?? 0),
      completedWorkOrders: revenueAgg._count,
      totalWorkOrders: woCount,
      totalInvoiced: Number(invoiceAgg._sum.total ?? 0),
      totalCollected: Number(invoiceAgg._sum.amountPaid ?? 0),
      outstanding: Number(invoiceAgg._sum.total ?? 0) - Number(invoiceAgg._sum.amountPaid ?? 0),
      invoiceCount: invoiceAgg._count,
      monthlyRevenue: (monthlyRevenue || []).map((r: { month: string; revenue: number }) => ({
        month: r.month,
        revenue: Number(r.revenue),
      })),
    };
  }

  async getWorkshop(branchId: string, from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [statusBreakdown, laborAgg, avgCompletion, topServices] = await Promise.all([
      this.prisma.workOrder.groupBy({
        by: ['status'],
        where: { branchId, deletedAt: null, ...dateFilter },
        _count: true,
      }),
      this.prisma.laborEntry.aggregate({
        where: {
          workOrder: { branchId, deletedAt: null, ...dateFilter },
          deletedAt: null,
        },
        _sum: { actualHours: true, lineTotal: true },
      }),
      this.prisma.$queryRawUnsafe<Array<{ avg_days: number }>>(
        `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM ("completed_at" - "created_at")) / 86400), 0) AS avg_days
         FROM work_orders
         WHERE branch_id = $1::uuid
           AND status IN ('COMPLETED', 'DELIVERED')
           AND "completed_at" IS NOT NULL
           AND deleted_at IS NULL
           ${from ? `AND "created_at" >= $2::timestamp` : ''}
           ${to ? `AND "created_at" <= ${from ? '$3::timestamp' : '$2::timestamp'}` : ''}`,
        ...this.buildParams(branchId, from, to),
      ),
      this.prisma.laborEntry.groupBy({
        by: ['serviceId'],
        where: {
          workOrder: { branchId, deletedAt: null, ...dateFilter },
          deletedAt: null,
        },
        _count: true,
        _sum: { lineTotal: true },
        orderBy: { _count: { serviceId: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
      totalLaborHours: Number(laborAgg._sum.actualHours ?? 0),
      totalLaborRevenue: Number(laborAgg._sum.lineTotal ?? 0),
      averageCompletionDays: Number((avgCompletion as any[])?.[0]?.avg_days ?? 0),
      topServices,
    };
  }

  async getMechanic(branchId: string, from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const mechanics = await this.prisma.user.findMany({
      where: {
        roles: { some: { role: { name: 'MECHANIC' } } },
        branchAssignments: { some: { branchId } },
      },
      select: { id: true, firstName: true, lastName: true },
    });

    const stats = await Promise.all(
      mechanics.map(async (mech) => {
        const [woCount, laborSum, timeSum] = await Promise.all([
          this.prisma.workOrder.count({
            where: { assignedTo: mech.id, deletedAt: null, ...dateFilter },
          }),
          this.prisma.laborEntry.aggregate({
            where: {
              mechanicId: mech.id,
              deletedAt: null,
              workOrder: { branchId, deletedAt: null, ...dateFilter },
            },
            _sum: { actualHours: true, lineTotal: true },
          }),
          this.prisma.timeEntry.aggregate({
            where: {
              mechanicId: mech.id,
              clockOut: { not: null },
              workOrder: { branchId, deletedAt: null, ...dateFilter },
            },
            _sum: { totalMinutes: true },
          }),
        ]);

        return {
          id: mech.id,
          name: `${mech.firstName} ${mech.lastName}`,
          workOrders: woCount,
          laborHours: Number(laborSum._sum.actualHours ?? 0),
          laborRevenue: Number(laborSum._sum.lineTotal ?? 0),
          clockedMinutes: Number(timeSum._sum.totalMinutes ?? 0),
        };
      }),
    );

    return stats;
  }

  async getInventory(branchId: string) {
    const stockItems = await this.prisma.stockItem.findMany({
      where: { warehouse: { branchId }, isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        quantityOnHand: true,
        quantityReserved: true,
        reorderPoint: true,
        unitCost: true,
        sellingPrice: true,
      },
      orderBy: { quantityOnHand: 'asc' },
    });

    const categoryBreakdown = await this.prisma.stockItem.groupBy({
      by: ['category'],
      where: {
        warehouse: { branchId },
        isActive: true,
        deletedAt: null,
        category: { not: null },
      },
      _count: true,
      _avg: { sellingPrice: true, unitCost: true },
    });

    const lowStock = stockItems.filter(
      (i) =>
        Number(i.reorderPoint) > 0 &&
        Number(i.quantityOnHand) - Number(i.quantityReserved) <= Number(i.reorderPoint),
    );

    const totalStockValue = stockItems.reduce(
      (sum, i) => sum + Number(i.quantityOnHand) * Number(i.unitCost),
      0,
    );

    const totalSellingValue = stockItems.reduce(
      (sum, i) => sum + Number(i.quantityOnHand) * Number(i.sellingPrice),
      0,
    );

    return {
      totalItems: stockItems.length,
      totalStockValue,
      totalSellingValue,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map((i) => ({
        id: i.id,
        name: i.name,
        sku: i.sku,
        quantityOnHand: Number(i.quantityOnHand),
        quantityReserved: Number(i.quantityReserved),
        available: Number(i.quantityOnHand) - Number(i.quantityReserved),
        reorderPoint: Number(i.reorderPoint),
        unitCost: Number(i.unitCost),
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        count: c._count,
        avgCost: Number(c._avg.unitCost ?? 0),
        avgPrice: Number(c._avg.sellingPrice ?? 0),
      })),
    };
  }

  async getCustomers(branchId: string, from?: string, to?: string) {
    const dateFilter = this.dateFilter(from, to);

    const [total, newCustomers, topCustomers] = await Promise.all([
      this.prisma.customer.count({ where: { branchId, deletedAt: null } }),
      this.prisma.customer.count({
        where: { branchId, deletedAt: null, ...dateFilter },
      }),
      this.prisma.customer.findMany({
        where: { branchId, deletedAt: null, workOrders: { some: { deletedAt: null } } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          _count: { select: { workOrders: true } },
        },
        orderBy: { workOrders: { _count: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalCustomers: total,
      newCustomers,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        name: c.companyName || `${c.firstName} ${c.lastName}`,
        workOrderCount: c._count.workOrders,
      })),
    };
  }

  private dateFilter(from?: string, to?: string) {
    if (!from && !to) return {};
    const filter: Record<string, Date> = {};
    if (from) filter.gte = new Date(from);
    if (to) filter.lte = new Date(to);
    return { createdAt: filter };
  }

  private buildParams(branchId: string, from?: string, to?: string): string[] {
    const params = [branchId];
    if (from) params.push(from);
    if (to) params.push(to);
    return params;
  }
}
