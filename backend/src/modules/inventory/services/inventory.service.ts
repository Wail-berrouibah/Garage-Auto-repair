import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateInventoryDto } from '../dto/create-inventory.dto';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { QueryInventoryDto } from '../dto/query-inventory.dto';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';

function serializeItem(item: any) {
  if (!item) return item;
  return {
    ...item,
    quantityOnHand: Number(item.quantityOnHand),
    quantityReserved: Number(item.quantityReserved),
    unitCost: Number(item.unitCost),
    sellingPrice: Number(item.sellingPrice),
    reorderPoint: Number(item.reorderPoint),
    reorderQuantity: Number(item.reorderQuantity),
  };
}

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryDto) {
    const warehouseId = dto.warehouseId;
    if (!warehouseId) {
      throw new ConflictException('Warehouse ID is required');
    }

    const existing = await this.prisma.stockItem.findUnique({
      where: { sku_warehouseId: { sku: dto.sku, warehouseId } },
    });

    if (existing) {
      throw new ConflictException('SKU already exists in this warehouse');
    }

    const item = await this.prisma.stockItem.create({
      data: {
        sku: dto.sku,
        partNumber: dto.partNumber,
        barcode: dto.barcode,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        brand: dto.brand,
        unitOfMeasure: dto.unitOfMeasure ?? 'EA',
        quantityOnHand: dto.quantityOnHand ?? 0,
        quantityReserved: dto.quantityReserved ?? 0,
        unitCost: dto.unitCost,
        sellingPrice: dto.sellingPrice,
        reorderPoint: dto.reorderPoint ?? 0,
        reorderQuantity: dto.reorderQuantity ?? 0,
        leadTimeDays: dto.leadTimeDays ?? null,
        trackBatch: dto.trackBatch ?? false,
        trackSerial: dto.trackSerial ?? false,
        warehouseId,
      },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Stock item created: ${item.sku} (${item.name})`);
    return serializeItem(item);
  }

  async findAll(query: QueryInventoryDto) {
    const { page, pageSize, search, category, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockItemWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.stockItem.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockItem.count({ where }),
    ]);

    return {
      data: data.map(serializeItem),
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
    if (!isUUID(id)) {
      throw new NotFoundException('Stock item not found');
    }

    const item = await this.prisma.stockItem.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Stock item not found');
    }

    return serializeItem(item);
  }

  async update(id: string, dto: UpdateInventoryDto) {
    if (!isUUID(id)) {
      throw new NotFoundException('Stock item not found');
    }

    const item = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Stock item not found');
    }

    if (dto.sku || dto.warehouseId) {
      const conflictSku = dto.sku ?? item.sku;
      const conflictWarehouseId = dto.warehouseId ?? item.warehouseId;

      const existing = await this.prisma.stockItem.findUnique({
        where: { sku_warehouseId: { sku: conflictSku, warehouseId: conflictWarehouseId } },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('SKU already exists in this warehouse');
      }
    }

    const updateData: Prisma.StockItemUpdateInput = {};
    if (dto.sku !== undefined) updateData.sku = dto.sku;
    if (dto.partNumber !== undefined) updateData.partNumber = dto.partNumber;
    if (dto.barcode !== undefined) updateData.barcode = dto.barcode;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.brand !== undefined) updateData.brand = dto.brand;
    if (dto.unitOfMeasure !== undefined) updateData.unitOfMeasure = dto.unitOfMeasure;
    if (dto.quantityOnHand !== undefined) updateData.quantityOnHand = dto.quantityOnHand;
    if (dto.quantityReserved !== undefined) updateData.quantityReserved = dto.quantityReserved;
    if (dto.unitCost !== undefined) updateData.unitCost = dto.unitCost;
    if (dto.sellingPrice !== undefined) updateData.sellingPrice = dto.sellingPrice;
    if (dto.reorderPoint !== undefined) updateData.reorderPoint = dto.reorderPoint;
    if (dto.reorderQuantity !== undefined) updateData.reorderQuantity = dto.reorderQuantity;
    if (dto.leadTimeDays !== undefined) updateData.leadTimeDays = dto.leadTimeDays;
    if (dto.trackBatch !== undefined) updateData.trackBatch = dto.trackBatch;
    if (dto.trackSerial !== undefined) updateData.trackSerial = dto.trackSerial;
    if (dto.warehouseId !== undefined) updateData.warehouse = { connect: { id: dto.warehouseId } };

    const updated = await this.prisma.stockItem.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    return serializeItem(updated);
  }

  async remove(id: string) {
    if (!isUUID(id)) {
      throw new NotFoundException('Stock item not found');
    }

    const item = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Stock item not found');
    }

    await this.prisma.stockItem.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Stock item deactivated successfully' };
  }

  async adjustStock(id: string, dto: AdjustInventoryDto, userId: string) {
    if (!isUUID(id)) {
      throw new NotFoundException('Stock item not found');
    }

    const item = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!item) {
      throw new NotFoundException('Stock item not found');
    }

    const newQuantity = Number(item.quantityOnHand) + dto.quantity;

    if (newQuantity < 0) {
      throw new ConflictException('Insufficient stock quantity');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.stockItem.update({
        where: { id },
        data: { quantityOnHand: newQuantity },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.stockMovement.create({
        data: {
          stockItemId: id,
          movementType: dto.quantity >= 0 ? 'ADJUSTMENT' : 'ADJUSTMENT',
          quantity: Math.abs(dto.quantity),
          unitCost: item.unitCost,
          notes: dto.reason ?? null,
          performedBy: userId,
        },
      }),
    ]);

    this.logger.log(`Stock adjusted: ${item.sku} (${dto.quantity > 0 ? '+' : ''}${dto.quantity})`);
    return serializeItem(updated);
  }
}
