import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(branchId: string) {
    const [totalWorkOrders, vehiclesInShop, totalCustomers, revenueAgg] =
      await Promise.all([
        this.prisma.workOrder.count({
          where: { branchId, deletedAt: null },
        }),
        this.prisma.workOrder.count({
          where: {
            branchId,
            deletedAt: null,
            status: { notIn: ['DELIVERED'] },
          },
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
      ]);

    return {
      totalWorkOrders,
      vehiclesInShop,
      totalCustomers,
      totalRevenue: Number(revenueAgg._sum.actualTotal ?? 0),
    };
  }
}
