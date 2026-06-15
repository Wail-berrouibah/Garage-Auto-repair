import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { Prisma, PoStatus } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { UpdatePoStatusDto } from '../dto/update-po-status.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { CreatePoLineItemDto } from '../dto/create-po-line-item.dto';
import { UpdatePoLineItemDto } from '../dto/update-po-line-item.dto';

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['PARTIAL', 'RECEIVED', 'CANCELLED'],
  PARTIAL: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [],
  CANCELLED: [],
};

function serializePO(po: any) {
  if (!po) return po;
  return {
    ...po,
    subtotal: Number(po.subtotal),
    taxTotal: Number(po.taxTotal),
    shippingTotal: Number(po.shippingTotal),
    grandTotal: Number(po.grandTotal),
    lineItems: po.lineItems?.map((li: any) => ({
      ...li,
      quantityOrdered: Number(li.quantityOrdered),
      quantityReceived: Number(li.quantityReceived),
      unitPrice: Number(li.unitPrice),
      lineTotal: Number(li.lineTotal),
    })),
  };
}

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generatePoNumber(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const prefix = branch?.code?.toUpperCase() || 'PO';
    const count = await this.prisma.purchaseOrder.count({ where: { branchId } });
    const seq = String(count + 1).padStart(5, '0');
    return `${prefix}-${seq}`;
  }

  async create(dto: CreatePurchaseOrderDto, userId: string) {
    const branchId = dto.branchId;
    if (!branchId) {
      throw new ConflictException('Branch ID is required');
    }

    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const poNumber = await this.generatePoNumber(branchId);

    let lineNumber = 0;
    const lineItemsData = dto.lineItems.map((li) => {
      lineNumber++;
      const lineTotal = li.quantityOrdered * li.unitPrice;
      return {
        partNumber: li.partNumber,
        description: li.description,
        quantityOrdered: li.quantityOrdered,
        unitPrice: li.unitPrice,
        lineTotal,
        lineNumber,
        stockItemId: li.stockItemId ?? null,
      };
    });

    const subtotal = lineItemsData.reduce((sum, li) => sum + li.lineTotal, 0);
    const grandTotal = subtotal;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        branchId,
        supplierId: dto.supplierId,
        status: 'DRAFT',
        subtotal,
        grandTotal,
        notes: dto.notes,
        createdBy: userId,
        lineItems: {
          create: lineItemsData,
        },
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        lineItems: { orderBy: { lineNumber: 'asc' } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`Purchase order created: ${po.poNumber}`);
    return serializePO(po);
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const { page, pageSize, search, status, supplierId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.PurchaseOrderWhereInput = {};

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status as PoStatus;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          supplier: { select: { id: true, name: true, code: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: data.map(serializePO),
      meta: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page * pageSize < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        lineItems: {
          orderBy: { lineNumber: 'asc' },
          include: {
            stockItem: { select: { id: true, name: true, sku: true } },
          },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    return serializePO(po);
  }

  async update(id: string, dto: UpdatePurchaseOrderDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT purchase orders can be edited');
    }

    if (dto.supplierId) {
      const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {};
    if (dto.supplierId !== undefined) updateData.supplier = { connect: { id: dto.supplierId } };
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        lineItems: { orderBy: { lineNumber: 'asc' } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return serializePO(updated);
  }

  async updateStatus(id: string, dto: UpdatePoStatusDto, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lineItems: true },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    const allowed = NEXT_STATUS[po.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${po.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {
      status: dto.status as PoStatus,
    };

    if (dto.status === 'RECEIVED') {
      updateData.receivedDate = new Date();
    }

    if (dto.status === 'RECEIVED' || dto.status === 'PARTIAL') {
      for (const li of po.lineItems) {
        await this.prisma.poLineItem.update({
          where: { id: li.id },
          data: { quantityReceived: dto.status === 'RECEIVED' ? li.quantityOrdered : li.quantityOrdered },
        });
      }
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        lineItems: { orderBy: { lineNumber: 'asc' } },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    this.logger.log(`PO ${po.poNumber} status: ${po.status} -> ${dto.status}`);
    return serializePO(updated);
  }

  async remove(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    await this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Purchase order deleted successfully' };
  }

  async addLineItem(id: string, dto: CreatePoLineItemDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Can only add items to DRAFT orders');
    }

    const maxLine = await this.prisma.poLineItem.findFirst({
      where: { purchaseOrderId: id },
      orderBy: { lineNumber: 'desc' },
      select: { lineNumber: true },
    });

    const lineNumber = (maxLine?.lineNumber ?? 0) + 1;
    const lineTotal = dto.quantityOrdered * dto.unitPrice;

    const item = await this.prisma.poLineItem.create({
      data: {
        purchaseOrderId: id,
        lineNumber,
        partNumber: dto.partNumber,
        description: dto.description,
        quantityOrdered: dto.quantityOrdered,
        unitPrice: dto.unitPrice,
        lineTotal,
        stockItemId: dto.stockItemId ?? null,
      },
      include: {
        stockItem: { select: { id: true, name: true, sku: true } },
      },
    });

    await this.recalculateTotals(id);

    return {
      ...item,
      quantityOrdered: Number(item.quantityOrdered),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    };
  }

  async updateLineItem(poId: string, itemId: string, dto: UpdatePoLineItemDto) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Can only edit items on DRAFT orders');
    }

    const item = await this.prisma.poLineItem.findUnique({ where: { id: itemId } });
    if (!item || item.purchaseOrderId !== poId) {
      throw new NotFoundException('Line item not found');
    }

    const updateData: Prisma.PoLineItemUpdateInput = {};
    if (dto.partNumber !== undefined) updateData.partNumber = dto.partNumber;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.quantityOrdered !== undefined) updateData.quantityOrdered = dto.quantityOrdered;
    if (dto.unitPrice !== undefined) updateData.unitPrice = dto.unitPrice;
    if (dto.stockItemId !== undefined) updateData.stockItem = { connect: { id: dto.stockItemId } };

    const qty = dto.quantityOrdered ?? Number(item.quantityOrdered);
    const price = dto.unitPrice ?? Number(item.unitPrice);
    updateData.lineTotal = qty * price;

    const updated = await this.prisma.poLineItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        stockItem: { select: { id: true, name: true, sku: true } },
      },
    });

    await this.recalculateTotals(poId);

    return {
      ...updated,
      quantityOrdered: Number(updated.quantityOrdered),
      unitPrice: Number(updated.unitPrice),
      lineTotal: Number(updated.lineTotal),
    };
  }

  async removeLineItem(poId: string, itemId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id: poId } });

    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }

    if (po.status !== 'DRAFT') {
      throw new BadRequestException('Can only remove items from DRAFT orders');
    }

    const item = await this.prisma.poLineItem.findUnique({ where: { id: itemId } });
    if (!item || item.purchaseOrderId !== poId) {
      throw new NotFoundException('Line item not found');
    }

    await this.prisma.poLineItem.delete({ where: { id: itemId } });
    await this.recalculateTotals(poId);

    return { message: 'Line item removed successfully' };
  }

  private async recalculateTotals(poId: string) {
    const items = await this.prisma.poLineItem.findMany({
      where: { purchaseOrderId: poId },
    });

    const subtotal = items.reduce((sum, li) => sum + Number(li.lineTotal), 0);

    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { subtotal, grandTotal: subtotal },
    });
  }
}
