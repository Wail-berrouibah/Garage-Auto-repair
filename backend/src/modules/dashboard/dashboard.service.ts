import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(branchId: string) {
    const [totalWorkOrders, distinctVehicles, totalCustomers, revenueAgg, statusBreakdown] =
      await Promise.all([
        this.prisma.workOrder.count({
          where: { branchId, deletedAt: null, status: { notIn: ['DELIVERED'] } },
        }),
        this.prisma.workOrder.findMany({
          where: { branchId, deletedAt: null, status: { notIn: ['DELIVERED'] } },
          select: { vehicleId: true },
          distinct: ['vehicleId'],
        }),
        this.prisma.customer.count({
          where: { branchId, deletedAt: null },
        }),
        this.prisma.workOrder.aggregate({
          where: {
            branchId,
            deletedAt: null,
            status: 'DELIVERED',
          },
          _sum: { actualTotal: true },
        }),
        this.prisma.workOrder.groupBy({
          by: ['status'],
          where: { branchId, deletedAt: null },
          _count: true,
        }),
      ]);

    return {
      totalWorkOrders,
      vehiclesInShop: distinctVehicles.length,
      totalCustomers,
      totalRevenue: Number(revenueAgg._sum.actualTotal ?? 0),
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count,
      })),
    };
  }
}
