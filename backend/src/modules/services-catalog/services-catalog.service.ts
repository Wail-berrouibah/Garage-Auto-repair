import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';

function serializeService(svc: any) {
  if (!svc) return svc;
  return {
    ...svc,
    defaultRate: Number(svc.defaultRate),
    estimatedHours: svc.estimatedHours ? Number(svc.estimatedHours) : null,
  };
}

@Injectable()
export class ServicesCatalogService {
  private readonly logger = new Logger(ServicesCatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceDto) {
    const branchId = dto.branchId;
    if (!branchId) {
      throw new ConflictException('Branch ID is required');
    }

    const existing = await this.prisma.service.findUnique({
      where: { code_branchId: { code: dto.code, branchId } },
    });

    if (existing) {
      throw new ConflictException('Service code already exists in this branch');
    }

    const service = await this.prisma.service.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        defaultRate: dto.defaultRate,
        rateUnit: dto.rateUnit ?? 'HOURLY',
        estimatedHours: dto.estimatedHours ?? null,
        branchId,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    this.logger.log(`Service created: ${service.code} (${service.name})`);
    return serializeService(service);
  }

  async findAll(query: QueryServiceDto) {
    const { page, pageSize, search, category, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ServiceWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, totalCount] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: data.map(serializeService),
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
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return serializeService(service);
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (dto.code || dto.branchId) {
      const conflictCode = dto.code ?? service.code;
      const conflictBranchId = dto.branchId ?? service.branchId!;

      const existing = await this.prisma.service.findUnique({
        where: { code_branchId: { code: conflictCode, branchId: conflictBranchId } },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Service code already exists in this branch');
      }
    }

    const updateData: Prisma.ServiceUpdateInput = {};
    if (dto.code !== undefined) updateData.code = dto.code;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.defaultRate !== undefined) updateData.defaultRate = dto.defaultRate;
    if (dto.rateUnit !== undefined) updateData.rateUnit = dto.rateUnit;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.branchId !== undefined) updateData.branch = { connect: { id: dto.branchId } };

    const updated = await this.prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return serializeService(updated);
  }

  async remove(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Service deactivated successfully' };
  }
}
