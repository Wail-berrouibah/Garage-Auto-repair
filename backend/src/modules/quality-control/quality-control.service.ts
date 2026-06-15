import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { QueryChecklistTemplateDto } from './dto/query-checklist-template.dto';
import { CreateQcInspectionDto } from './dto/create-qc-inspection.dto';
import { UpdateQcInspectionDto } from './dto/update-qc-inspection.dto';
import { QueryQcInspectionDto } from './dto/query-qc-inspection.dto';

@Injectable()
export class QualityControlService {
  private readonly logger = new Logger(QualityControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== CHECKLIST TEMPLATES ====================

  async createTemplate(dto: CreateChecklistTemplateDto, branchId: string) {
    const template = await this.prisma.checklistTemplate.create({
      data: {
        branchId,
        name: dto.name,
        serviceType: dto.serviceType,
        isActive: dto.isActive ?? true,
        items: dto.items?.length
          ? {
              create: dto.items.map((item, index) => ({
                description: item.description,
                isRequired: item.isRequired ?? true,
                sortOrder: item.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    this.logger.log(`Checklist template created: ${template.id}`);
    return template;
  }

  async findAllTemplates(query: QueryChecklistTemplateDto, branchId: string) {
    const { page, pageSize, search, serviceType, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      branchId,
      deletedAt: null,
      ...(search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {}),
      ...(serviceType ? { serviceType } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.checklistTemplate.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true, qcResults: true } },
        },
      }),
      this.prisma.checklistTemplate.count({ where }),
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

  async findTemplateById(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { qcResults: true } },
      },
    });

    if (!template || template.deletedAt) {
      throw new NotFoundException('Checklist template not found');
    }

    return template;
  }

  async updateTemplate(id: string, dto: UpdateChecklistTemplateDto) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });

    if (!template || template.deletedAt) {
      throw new NotFoundException('Checklist template not found');
    }

    return this.prisma.checklistTemplate.update({
      where: { id },
      data: dto,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async removeTemplate(id: string) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id } });

    if (!template || template.deletedAt) {
      throw new NotFoundException('Checklist template not found');
    }

    await this.prisma.checklistTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Checklist template deleted: ${id}`);
    return { message: 'Checklist template deleted successfully' };
  }

  // ==================== CHECKLIST ITEMS ====================

  async addTemplateItem(templateId: string, description: string, isRequired?: boolean, sortOrder?: number) {
    const template = await this.prisma.checklistTemplate.findUnique({ where: { id: templateId } });

    if (!template || template.deletedAt) {
      throw new NotFoundException('Checklist template not found');
    }

    const maxSort = await this.prisma.checklistItem.aggregate({
      where: { checklistTemplateId: templateId },
      _max: { sortOrder: true },
    });

    return this.prisma.checklistItem.create({
      data: {
        checklistTemplateId: templateId,
        description,
        isRequired: isRequired ?? true,
        sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateTemplateItem(itemId: string, dto: UpdateChecklistItemDto) {
    const item = await this.prisma.checklistItem.findUnique({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async removeTemplateItem(itemId: string) {
    const item = await this.prisma.checklistItem.findUnique({ where: { id: itemId } });

    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    await this.prisma.checklistItem.delete({ where: { id: itemId } });
    return { message: 'Checklist item removed successfully' };
  }

  // ==================== QC INSPECTIONS ====================

  async createInspection(dto: CreateQcInspectionDto, branchId: string, inspectorId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({ where: { id: dto.workOrderId } });

    if (!workOrder || workOrder.deletedAt) {
      throw new BadRequestException('Work order not found');
    }

    const template = await this.prisma.checklistTemplate.findUnique({ where: { id: dto.checklistTemplateId } });

    if (!template || template.deletedAt) {
      throw new BadRequestException('Checklist template not found');
    }

    const inspection = await this.prisma.qcInspectionResult.create({
      data: {
        workOrderId: dto.workOrderId,
        branchId,
        checklistTemplateId: dto.checklistTemplateId,
        inspectorId,
        result: dto.result,
        notes: dto.notes,
        checks: dto.checks?.length
          ? {
              create: dto.checks.map((check) => ({
                checklistItemId: check.checklistItemId,
                passed: check.passed,
                notes: check.notes,
              })),
            }
          : undefined,
      },
      include: {
        template: true,
        inspector: {
          select: { id: true, firstName: true, lastName: true },
        },
        checks: {
          include: { checklistItem: true },
        },
      },
    });

    this.logger.log(`QC inspection created: ${inspection.id} for work order ${dto.workOrderId}`);
    return inspection;
  }

  async findAllInspections(query: QueryQcInspectionDto, branchId: string) {
    const { page, pageSize, workOrderId, inspectorId, result } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {
      branchId,
      deletedAt: null,
      ...(workOrderId ? { workOrderId } : {}),
      ...(inspectorId ? { inspectorId } : {}),
      ...(result ? { result } : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.qcInspectionResult.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { inspectedAt: 'desc' },
        include: {
          template: { select: { id: true, name: true } },
          inspector: {
            select: { id: true, firstName: true, lastName: true },
          },
          workOrder: {
            select: { id: true, woNumber: true },
          },
          _count: { select: { checks: true } },
        },
      }),
      this.prisma.qcInspectionResult.count({ where }),
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

  async findInspectionById(id: string) {
    const inspection = await this.prisma.qcInspectionResult.findUnique({
      where: { id },
      include: {
        template: { include: { items: { orderBy: { sortOrder: 'asc' } } } },
        inspector: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        workOrder: {
          select: { id: true, woNumber: true, vehicleId: true, customerId: true },
        },
        checks: {
          include: { checklistItem: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!inspection || inspection.deletedAt) {
      throw new NotFoundException('QC inspection not found');
    }

    return inspection;
  }

  async updateInspection(id: string, dto: UpdateQcInspectionDto) {
    const inspection = await this.prisma.qcInspectionResult.findUnique({ where: { id } });

    if (!inspection || inspection.deletedAt) {
      throw new NotFoundException('QC inspection not found');
    }

    return this.prisma.qcInspectionResult.update({
      where: { id },
      data: dto,
      include: {
        template: { select: { id: true, name: true } },
        inspector: {
          select: { id: true, firstName: true, lastName: true },
        },
        checks: {
          include: { checklistItem: true },
        },
      },
    });
  }

  async updateCheck(checkId: string, passed: boolean, notes?: string) {
    const check = await this.prisma.qcCheck.findUnique({ where: { id: checkId } });

    if (!check) {
      throw new NotFoundException('QC check not found');
    }

    return this.prisma.qcCheck.update({
      where: { id: checkId },
      data: { passed, notes },
      include: { checklistItem: true },
    });
  }

  async findInspectionsByWorkOrder(workOrderId: string) {
    return this.prisma.qcInspectionResult.findMany({
      where: { workOrderId, deletedAt: null },
      orderBy: { inspectedAt: 'desc' },
      include: {
        template: { select: { id: true, name: true } },
        inspector: {
          select: { id: true, firstName: true, lastName: true },
        },
        checks: {
          include: { checklistItem: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }
}
