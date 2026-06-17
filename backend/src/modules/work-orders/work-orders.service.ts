import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma, WoStatus } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { isValidWoTransition } from '../../common/constants/status-codes';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { QueryWorkOrderDto } from './dto/query-work-order.dto';
import { CreateLaborEntryDto } from './dto/create-labor-entry.dto';
import { UpdateLaborEntryDto } from './dto/update-labor-entry.dto';
import { CreatePartEntryDto } from './dto/create-part-entry.dto';
import { UpdatePartEntryDto } from './dto/update-part-entry.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateWorkNoteDto } from './dto/create-work-note.dto';
import { UpdateWorkOrderStatusDto } from './dto/update-work-order-status.dto';

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateWoNumber(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    const code = branch?.code || 'XX';
    const date = new Date();
    const yymmdd = `${date.getFullYear().toString().slice(2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.prisma.workOrder.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        },
      },
    });
    const seq = String(count + 1).padStart(4, '0');
    const woNumber = `WO-${code}-${yymmdd}-${seq}`;
    return woNumber;
  }

  async create(dto: CreateWorkOrderDto, branchId: string, userId: string) {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const woNumber = await this.generateWoNumber(branchId);

      const data: any = {
        branchId,
        woNumber,
        customerId: dto.customerId,
        vehicleId: dto.vehicleId,
        complaint: dto.complaint,
        priority: dto.priority ?? 'NORMAL',
        diagnosis: dto.diagnosis,
        odometerIn: dto.odometerIn,
        odometerOut: dto.odometerOut,
        assignedTo: dto.assignedTo,
        estimatedTotal: dto.estimatedTotal,
        promisedDate: dto.promisedDate ? new Date(dto.promisedDate) : undefined,
        blockReason: dto.blockReason,
      };

      try {
        const workOrder = await this.prisma.workOrder.create({ data });

        await this.prisma.woStatusHistory.create({
          data: {
            workOrderId: workOrder.id,
            toStatus: 'OPEN',
            changedBy: userId,
          },
        });

        this.logger.log(`Work order created: ${workOrder.woNumber} (${workOrder.id})`);
        return workOrder;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < maxRetries - 1
        ) {
          this.logger.warn(`WO number collision ${woNumber}, retrying (${attempt + 1}/${maxRetries})`);
          continue;
        }
        throw err;
      }
    }
  }

  async findAll(query: QueryWorkOrderDto, branchId: string) {
    const { page, pageSize, search, status, notStatus, customerId, vehicleId, assignedTo } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.WorkOrderWhereInput = {
      deletedAt: null,
      branchId,
      ...(status ? { status } : {}),
      ...(notStatus && !status ? { status: { not: notStatus } } : {}),
      ...(customerId ? { customerId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(assignedTo ? { assignedTo } : {}),
      ...(search
        ? {
            OR: [
              { woNumber: { contains: search, mode: 'insensitive' as const } },
              { complaint: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const include = {
      customer: {
        select: { id: true, firstName: true, lastName: true, companyName: true },
      },
      vehicle: {
        select: { id: true, make: true, model: true, licensePlate: true },
      },
      assignedMechanic: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: {
          laborEntries: true,
          partEntries: true,
          timeEntries: true,
          workNotes: true,
        },
      },
    };

    // When no specific status filter, sort: non-DELIVERED first, then DELIVERED
    if (!status && !notStatus) {
      const [nonDelivered, delivered, nonDeliveredCount, deliveredCount] = await Promise.all([
        this.prisma.workOrder.findMany({
          where: { ...where, status: { not: 'DELIVERED' } },
          orderBy: { createdAt: 'desc' },
          include,
        }),
        this.prisma.workOrder.findMany({
          where: { ...where, status: 'DELIVERED' },
          orderBy: { createdAt: 'desc' },
          include,
        }),
        this.prisma.workOrder.count({ where: { ...where, status: { not: 'DELIVERED' } } }),
        this.prisma.workOrder.count({ where: { ...where, status: 'DELIVERED' } }),
      ]);

      const allData = [...nonDelivered, ...delivered];
      const totalCount = nonDeliveredCount + deliveredCount;
      const pagedData = allData.slice(skip, skip + pageSize);

      return {
        data: pagedData,
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

    const [data, totalCount] = await Promise.all([
      this.prisma.workOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include,
      }),
      this.prisma.workOrder.count({ where }),
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
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        assignedMechanic: {
          select: { id: true, firstName: true, lastName: true },
        },
        laborEntries: {
          where: { deletedAt: null },
          include: {
            service: { select: { id: true, name: true, code: true } },
            mechanic: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        partEntries: {
          where: { deletedAt: null },
          include: {
            stockItem: { select: { id: true, partNumber: true, name: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        timeEntries: {
          include: {
            mechanic: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { clockIn: 'desc' },
        },
        workNotes: {
          where: { deletedAt: null },
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            woAttachments: true,
            invoices: true,
            qcResults: true,
          },
        },
      },
    });

    if (!workOrder || workOrder.deletedAt) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  async update(id: string, dto: UpdateWorkOrderDto, userId: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Work order not found');
    }

    const updateData: any = {};
    if (dto.customerId !== undefined) updateData.customerId = dto.customerId;
    if (dto.vehicleId !== undefined) updateData.vehicleId = dto.vehicleId;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.complaint !== undefined) updateData.complaint = dto.complaint;
    if (dto.diagnosis !== undefined) updateData.diagnosis = dto.diagnosis;
    if (dto.odometerIn !== undefined) updateData.odometerIn = dto.odometerIn;
    if (dto.odometerOut !== undefined) updateData.odometerOut = dto.odometerOut;
    if (dto.assignedTo !== undefined) updateData.assignedTo = dto.assignedTo;
    if (dto.estimatedTotal !== undefined) updateData.estimatedTotal = dto.estimatedTotal;
    if (dto.actualTotal !== undefined) updateData.actualTotal = dto.actualTotal;
    if (dto.promisedDate !== undefined) updateData.promisedDate = new Date(dto.promisedDate);
    if (dto.blockReason !== undefined) updateData.blockReason = dto.blockReason;
    if (dto.isBlocked !== undefined) updateData.isBlocked = dto.isBlocked;

    const newStatus = dto.status;
    const statusChanging = newStatus !== undefined && newStatus !== existing.status;
    if (statusChanging) {
      if (!isValidWoTransition(existing.status, newStatus)) {
        throw new BadRequestException(
          `Invalid status transition from ${existing.status} to ${newStatus}`,
        );
      }
      updateData.status = newStatus;
      if (newStatus === 'IN_PROGRESS') updateData.startedAt = new Date();
      if (newStatus === 'COMPLETED') updateData.completedAt = new Date();
      if (newStatus === 'DELIVERED') {
        updateData.deliveredAt = new Date();
        if (dto.actualTotal === undefined) {
          const calculated = await this.calculateActualTotal(id);
          updateData.actualTotal = calculated !== 0 ? calculated : (existing.estimatedTotal ?? 0);
        }
      }
    }

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    if (statusChanging) {
      await this.prisma.woStatusHistory.create({
        data: {
          workOrderId: id,
          fromStatus: existing.status,
          toStatus: newStatus,
          changedBy: userId,
        },
      });
    }

    return workOrder;
  }

  async remove(id: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Work order not found');
    }

    await this.prisma.workOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Work order soft-deleted: ${id}`);
    return { message: 'Work order deleted successfully' };
  }

  async updateStatus(id: string, dto: UpdateWorkOrderStatusDto, userId: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Work order not found');
    }

    const fromStatus = existing.status;

    if (!isValidWoTransition(fromStatus, dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${fromStatus} to ${dto.status}`,
      );
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (dto.status === 'COMPLETED') updateData.completedAt = new Date();
    if (dto.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      if (existing.actualTotal === null) {
        const calculated = await this.calculateActualTotal(id);
        updateData.actualTotal = calculated !== 0 ? calculated : (existing.estimatedTotal ?? 0);
      }
    }

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.woStatusHistory.create({
      data: {
        workOrderId: id,
        fromStatus,
        toStatus: dto.status,
        changedBy: userId,
        reason: dto.reason,
      },
    });

    this.logger.log(`Work order ${workOrder.woNumber}: ${fromStatus} → ${dto.status}`);
    return workOrder;
  }

  async getStatusHistory(id: string) {
    const existing = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Work order not found');
    }

    return this.prisma.woStatusHistory.findMany({
      where: { workOrderId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Labor Entries ----

  async createLaborEntry(workOrderId: string, dto: CreateLaborEntryDto) {
    await this.ensureWorkOrderExists(workOrderId);
    const maxSort = await this.prisma.laborEntry.aggregate({
      where: { workOrderId },
      _max: { sortOrder: true },
    });
    return this.prisma.laborEntry.create({
      data: {
        workOrderId,
        serviceId: dto.serviceId,
        mechanicId: dto.mechanicId,
        description: dto.description,
        estimatedHours: dto.estimatedHours ?? 0,
        actualHours: dto.actualHours,
        rate: dto.rate,
        rateUnit: dto.rateUnit ?? 'HOURLY',
        lineTotal: dto.lineTotal ?? 0,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      include: {
        service: { select: { id: true, name: true, code: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findLaborEntries(workOrderId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.laborEntry.findMany({
      where: { workOrderId, deletedAt: null },
      include: {
        service: { select: { id: true, name: true, code: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateLaborEntry(workOrderId: string, laborId: string, dto: UpdateLaborEntryDto) {
    const entry = await this.prisma.laborEntry.findUnique({
      where: { id: laborId },
    });
    if (!entry || entry.workOrderId !== workOrderId || entry.deletedAt) {
      throw new NotFoundException('Labor entry not found');
    }

    const updateData: any = {};
    if (dto.serviceId !== undefined) updateData.serviceId = dto.serviceId;
    if (dto.mechanicId !== undefined) updateData.mechanicId = dto.mechanicId;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.estimatedHours !== undefined) updateData.estimatedHours = dto.estimatedHours;
    if (dto.actualHours !== undefined) updateData.actualHours = dto.actualHours;
    if (dto.rate !== undefined) updateData.rate = dto.rate;
    if (dto.rateUnit !== undefined) updateData.rateUnit = dto.rateUnit;
    if (dto.lineTotal !== undefined) updateData.lineTotal = dto.lineTotal;

    return this.prisma.laborEntry.update({
      where: { id: laborId },
      data: updateData,
      include: {
        service: { select: { id: true, name: true, code: true } },
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async removeLaborEntry(workOrderId: string, laborId: string) {
    const entry = await this.prisma.laborEntry.findUnique({
      where: { id: laborId },
    });
    if (!entry || entry.workOrderId !== workOrderId || entry.deletedAt) {
      throw new NotFoundException('Labor entry not found');
    }
    await this.prisma.laborEntry.update({
      where: { id: laborId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Labor entry removed successfully' };
  }

  // ---- Part Entries ----

  async createPartEntry(workOrderId: string, dto: CreatePartEntryDto) {
    await this.ensureWorkOrderExists(workOrderId);
    const maxSort = await this.prisma.partEntry.aggregate({
      where: { workOrderId },
      _max: { sortOrder: true },
    });
    return this.prisma.partEntry.create({
      data: {
        workOrderId,
        stockItemId: dto.stockItemId,
        partNumber: dto.partNumber,
        partName: dto.partName,
        quantity: dto.quantity ?? 1,
        unitPrice: dto.unitPrice ?? 0,
        lineTotal: dto.lineTotal ?? 0,
        isBackorder: dto.isBackorder ?? false,
        batchNumber: dto.batchNumber,
        serialNumber: dto.serialNumber,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      include: {
        stockItem: { select: { id: true, partNumber: true, name: true } },
      },
    });
  }

  async findPartEntries(workOrderId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.partEntry.findMany({
      where: { workOrderId, deletedAt: null },
      include: {
        stockItem: { select: { id: true, partNumber: true, name: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updatePartEntry(workOrderId: string, partId: string, dto: UpdatePartEntryDto) {
    const entry = await this.prisma.partEntry.findUnique({
      where: { id: partId },
    });
    if (!entry || entry.workOrderId !== workOrderId || entry.deletedAt) {
      throw new NotFoundException('Part entry not found');
    }

    const updateData: any = {};
    if (dto.stockItemId !== undefined) updateData.stockItemId = dto.stockItemId;
    if (dto.partNumber !== undefined) updateData.partNumber = dto.partNumber;
    if (dto.partName !== undefined) updateData.partName = dto.partName;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity;
    if (dto.unitPrice !== undefined) updateData.unitPrice = dto.unitPrice;
    if (dto.lineTotal !== undefined) updateData.lineTotal = dto.lineTotal;
    if (dto.isBackorder !== undefined) updateData.isBackorder = dto.isBackorder;
    if (dto.batchNumber !== undefined) updateData.batchNumber = dto.batchNumber;
    if (dto.serialNumber !== undefined) updateData.serialNumber = dto.serialNumber;

    return this.prisma.partEntry.update({
      where: { id: partId },
      data: updateData,
      include: {
        stockItem: { select: { id: true, partNumber: true, name: true } },
      },
    });
  }

  async removePartEntry(workOrderId: string, partId: string) {
    const entry = await this.prisma.partEntry.findUnique({
      where: { id: partId },
    });
    if (!entry || entry.workOrderId !== workOrderId || entry.deletedAt) {
      throw new NotFoundException('Part entry not found');
    }
    await this.prisma.partEntry.update({
      where: { id: partId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Part entry removed successfully' };
  }

  // ---- Time Entries ----

  async clockIn(workOrderId: string, dto: CreateTimeEntryDto) {
    await this.ensureWorkOrderExists(workOrderId);
    const activeEntry = await this.prisma.timeEntry.findFirst({
      where: { mechanicId: dto.mechanicId, clockOut: null },
    });
    if (activeEntry) {
      throw new BadRequestException('Mechanic already clocked in on another work order');
    }
    return this.prisma.timeEntry.create({
      data: {
        workOrderId,
        mechanicId: dto.mechanicId,
        clockIn: new Date(dto.clockIn),
        isBillable: dto.isBillable ?? true,
        notes: dto.notes,
      },
      include: {
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async clockOut(workOrderId: string, timeEntryId: string, userId: string) {
    const entry = await this.prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
    });
    if (!entry || entry.workOrderId !== workOrderId) {
      throw new NotFoundException('Time entry not found');
    }
    if (entry.clockOut) {
      throw new BadRequestException('Already clocked out');
    }

    const clockOut = new Date();
    const totalMinutes = Math.round((clockOut.getTime() - entry.clockIn.getTime()) / 60000);

    return this.prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: { clockOut, totalMinutes },
      include: {
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findTimeEntries(workOrderId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.timeEntry.findMany({
      where: { workOrderId },
      include: {
        mechanic: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { clockIn: 'desc' },
    });
  }

  // ---- Work Notes ----

  async createWorkNote(workOrderId: string, dto: CreateWorkNoteDto, userId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.workNote.create({
      data: {
        workOrderId,
        authorId: userId,
        noteType: dto.noteType,
        content: dto.content,
        isPinned: dto.isPinned ?? false,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findWorkNotes(workOrderId: string) {
    await this.ensureWorkOrderExists(workOrderId);
    return this.prisma.workNote.findMany({
      where: { workOrderId, deletedAt: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async removeWorkNote(workOrderId: string, noteId: string) {
    const note = await this.prisma.workNote.findUnique({
      where: { id: noteId },
    });
    if (!note || note.workOrderId !== workOrderId || note.deletedAt) {
      throw new NotFoundException('Work note not found');
    }
    await this.prisma.workNote.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });
    return { message: 'Note deleted successfully' };
  }

  // ---- Helpers ----

  private async calculateActualTotal(workOrderId: string): Promise<number> {
    const [laborAgg, partsAgg] = await Promise.all([
      this.prisma.laborEntry.aggregate({
        where: { workOrderId, deletedAt: null },
        _sum: { lineTotal: true },
      }),
      this.prisma.partEntry.aggregate({
        where: { workOrderId, deletedAt: null },
        _sum: { lineTotal: true },
      }),
    ]);
    return Number(laborAgg._sum.lineTotal ?? 0) + Number(partsAgg._sum.lineTotal ?? 0);
  }

  private async ensureWorkOrderExists(id: string) {
    const wo = await this.prisma.workOrder.findUnique({ where: { id } });
    if (!wo || wo.deletedAt) {
      throw new NotFoundException('Work order not found');
    }
  }
}
