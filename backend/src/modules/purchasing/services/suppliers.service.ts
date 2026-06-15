import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { QuerySupplierDto } from '../dto/query-supplier.dto';

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    const branchId = dto.branchId;
    if (!branchId) {
      throw new ConflictException('Branch ID is required');
    }

    const existing = await this.prisma.supplier.findUnique({
      where: { code_branchId: { code: dto.code, branchId } },
    });

    if (existing) {
      throw new ConflictException('Supplier code already exists in this branch');
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        code: dto.code,
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        paymentTerms: dto.paymentTerms,
        leadTimeDays: dto.leadTimeDays ?? null,
        notes: dto.notes,
        branchId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Supplier created: ${supplier.code} (${supplier.name})`);
    return supplier;
  }

  async findAll(query: QuerySupplierDto) {
    const { page, pageSize, search, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SupplierWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
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
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    if (dto.code || dto.branchId) {
      const conflictCode = dto.code ?? supplier.code;
      const conflictBranchId = dto.branchId ?? supplier.branchId!;

      const existing = await this.prisma.supplier.findUnique({
        where: { code_branchId: { code: conflictCode, branchId: conflictBranchId } },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Supplier code already exists in this branch');
      }
    }

    const updateData: Prisma.SupplierUpdateInput = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.contactPerson !== undefined) updateData.contactPerson = dto.contactPerson;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
    if (dto.paymentTerms !== undefined) updateData.paymentTerms = dto.paymentTerms;
    if (dto.leadTimeDays !== undefined) updateData.leadTimeDays = dto.leadTimeDays;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.branchId !== undefined) updateData.branch = { connect: { id: dto.branchId } };

    return this.prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async remove(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    await this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Supplier deactivated successfully' };
  }
}
