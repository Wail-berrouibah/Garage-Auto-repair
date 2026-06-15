import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { CreateInvoiceLineDto } from './dto/create-invoice-line.dto';
import { UpdateInvoiceLineDto } from './dto/update-invoice-line.dto';

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ['ISSUED', 'CANCELLED'],
  ISSUED: ['PARTIALLY_PAID', 'PAID', 'CANCELLED'],
  PARTIALLY_PAID: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
  CREDITED: [],
};

function serializeInvoice(inv: any) {
  if (!inv) return inv;
  return {
    ...inv,
    subtotal: Number(inv.subtotal),
    discountValue: Number(inv.discountValue),
    taxTotal: Number(inv.taxTotal),
    total: Number(inv.total),
    amountPaid: Number(inv.amountPaid),
    lines: inv.lines?.map((l: any) => ({
      ...l,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unitPrice),
      discount: Number(l.discount),
      lineTotal: Number(l.lineTotal),
    })),
    taxLines: inv.taxLines?.map((t: any) => ({
      ...t,
      taxRate: Number(t.taxRate),
      taxBase: Number(t.taxBase),
      taxAmount: Number(t.taxAmount),
    })),
  };
}

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateInvoiceNumber(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    const prefix = branch?.code?.toUpperCase() || 'INV';
    const count = await this.prisma.invoice.count({ where: { branchId } });
    const seq = String(count + 1).padStart(5, '0');
    return `${prefix}-${seq}`;
  }

  async create(dto: CreateInvoiceDto) {
    const branchId = dto.branchId;
    if (!branchId) {
      throw new ConflictException('Branch ID is required');
    }

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: dto.workOrderId },
      select: { id: true, customerId: true },
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    const invoiceNumber = await this.generateInvoiceNumber(branchId);

    const lineItemsData = dto.lineItems.map((li, idx) => {
      const discount = li.discount ?? 0;
      const lineTotal = li.quantity * li.unitPrice - discount;
      return {
        lineType: li.lineType,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discount,
        lineTotal,
        sortOrder: idx,
      };
    });

    const subtotal = lineItemsData.reduce((sum, li) => sum + li.lineTotal, 0);
    const discountAmount = dto.discountType === 'PERCENTAGE'
      ? subtotal * ((dto.discountValue ?? 0) / 100)
      : (dto.discountValue ?? 0);
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const total = afterDiscount;

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        branchId,
        workOrderId: dto.workOrderId,
        customerId: workOrder.customerId,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal,
        discountType: dto.discountType ?? null,
        discountValue: discountAmount,
        total,
        notes: dto.notes,
        lines: {
          create: lineItemsData,
        },
      },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { id: true, woNumber: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    });

    this.logger.log(`Invoice created: ${invoice.invoiceNumber}`);
    return serializeInvoice(invoice);
  }

  async findAll(query: QueryInvoiceDto) {
    const { page, pageSize, search, status, customerId } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.InvoiceWhereInput = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ]}},
      ];
    }

    if (status) {
      where.status = status as InvoiceStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          workOrder: { select: { id: true, woNumber: true } },
          _count: { select: { lines: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: data.map(serializeInvoice),
      meta: {
        page, pageSize, totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: page * pageSize < totalCount,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { id: true, woNumber: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
        allocations: {
          include: {
            payment: { select: { id: true, amount: true, paymentMethod: true, paidAt: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return serializeInvoice(invoice);
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT invoices can be edited');
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (dto.discountType !== undefined) updateData.discountType = dto.discountType;
    if (dto.discountValue !== undefined) updateData.discountValue = dto.discountValue;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.discountType !== undefined || dto.discountValue !== undefined) {
      const newDiscountType = dto.discountType ?? invoice.discountType;
      const newDiscountValue = dto.discountValue !== undefined ? dto.discountValue : Number(invoice.discountValue);
      const discountAmount = newDiscountType === 'PERCENTAGE'
        ? Number(invoice.subtotal) * (newDiscountValue / 100)
        : newDiscountValue;
      updateData.discountValue = discountAmount;
      updateData.total = Math.max(0, Number(invoice.subtotal) - discountAmount);
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { id: true, woNumber: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return serializeInvoice(updated);
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const allowed = NEXT_STATUS[invoice.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${invoice.status} to ${dto.status}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {
      status: dto.status as InvoiceStatus,
    };

    if (dto.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        workOrder: { select: { id: true, woNumber: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    });

    this.logger.log(`Invoice ${invoice.invoiceNumber}: ${invoice.status} -> ${dto.status}`);
    return serializeInvoice(updated);
  }

  async remove(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Invoice deleted successfully' };
  }

  async addLine(invoiceId: string, dto: CreateInvoiceLineDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only add lines to DRAFT invoices');
    }

    const maxSort = await this.prisma.invoiceLine.findFirst({
      where: { invoiceId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    const discount = dto.discount ?? 0;
    const lineTotal = dto.quantity * dto.unitPrice - discount;

    const line = await this.prisma.invoiceLine.create({
      data: {
        invoiceId,
        lineType: dto.lineType,
        description: dto.description,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        discount,
        lineTotal,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    await this.recalculateInvoice(invoiceId);

    return {
      ...line,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discount: Number(line.discount),
      lineTotal: Number(line.lineTotal),
    };
  }

  async updateLine(invoiceId: string, lineId: string, dto: UpdateInvoiceLineDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only edit lines on DRAFT invoices');
    }

    const line = await this.prisma.invoiceLine.findUnique({ where: { id: lineId } });
    if (!line || line.invoiceId !== invoiceId) {
      throw new NotFoundException('Invoice line not found');
    }

    const updateData: Prisma.InvoiceLineUpdateInput = {};
    if (dto.lineType !== undefined) updateData.lineType = dto.lineType;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.unitPrice !== undefined) updateData.unitPrice = dto.unitPrice;
    if (dto.discount !== undefined) updateData.discount = dto.discount;

    const qty = dto.quantity ?? Number(line.quantity);
    const price = dto.unitPrice ?? Number(line.unitPrice);
    const disc = dto.discount ?? Number(line.discount);
    updateData.lineTotal = qty * price - disc;

    const updated = await this.prisma.invoiceLine.update({
      where: { id: lineId },
      data: updateData,
    });

    await this.recalculateInvoice(invoiceId);

    return {
      ...updated,
      quantity: Number(updated.quantity),
      unitPrice: Number(updated.unitPrice),
      discount: Number(updated.discount),
      lineTotal: Number(updated.lineTotal),
    };
  }

  async removeLine(invoiceId: string, lineId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Can only remove lines from DRAFT invoices');
    }

    const line = await this.prisma.invoiceLine.findUnique({ where: { id: lineId } });
    if (!line || line.invoiceId !== invoiceId) {
      throw new NotFoundException('Invoice line not found');
    }

    await this.prisma.invoiceLine.delete({ where: { id: lineId } });
    await this.recalculateInvoice(invoiceId);

    return { message: 'Invoice line removed successfully' };
  }

  private async recalculateInvoice(invoiceId: string) {
    const lines = await this.prisma.invoiceLine.findMany({
      where: { invoiceId },
    });

    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { discountType: true, discountValue: true },
    });

    if (!invoice) return;

    const subtotal = lines.reduce((sum, l) => sum + Number(l.lineTotal), 0);
    const discountAmount = invoice.discountType === 'PERCENTAGE'
      ? subtotal * (Number(invoice.discountValue) / 100)
      : Number(invoice.discountValue);
    const total = Math.max(0, subtotal - discountAmount);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { subtotal, total },
    });
  }
}
