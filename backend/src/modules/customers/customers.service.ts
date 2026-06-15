import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, branchId: string) {
    const customer = await this.prisma.customer.create({
      data: {
        branchId,
        customerType: dto.customerType,
        firstName: dto.firstName,
        lastName: dto.lastName,
        companyName: dto.companyName,
        email: dto.email,
        phone: dto.phone,
        phoneSecondary: dto.phoneSecondary,
        addressLine1: dto.addressLine1,
        addressLine2: dto.addressLine2,
        city: dto.city,
        state: dto.state,
        zipCode: dto.zipCode,
        taxId: dto.taxId,
        notes: dto.notes,
        tags: dto.tags ?? [],
        isActive: dto.isActive ?? true,
      },
    });

    this.logger.log(`Customer created: ${customer.id}`);
    return customer;
  }

  async findAll(pagination: PaginationQueryDto, search?: string) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              vehicles: true,
              workOrders: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
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
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicles: true,
            workOrders: true,
          },
        },
      },
    });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    const updateData: any = {};
    if (dto.customerType !== undefined) updateData.customerType = dto.customerType;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.companyName !== undefined) updateData.companyName = dto.companyName;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.phoneSecondary !== undefined) updateData.phoneSecondary = dto.phoneSecondary;
    if (dto.addressLine1 !== undefined) updateData.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) updateData.addressLine2 = dto.addressLine2;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipCode !== undefined) updateData.zipCode = dto.zipCode;
    if (dto.taxId !== undefined) updateData.taxId = dto.taxId;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

    return this.prisma.customer.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.customerVehicle.deleteMany({ where: { customerId: id } }),
      this.prisma.workOrder.updateMany({
        where: { customerId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.customer.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);

    this.logger.log(`Customer deleted with cascade: ${id}`);
    return { message: 'Customer deleted successfully' };
  }

  async assignVehicle(customerId: string, vehicleId: string, relationship?: string, isPrimary?: boolean) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle || vehicle.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    const existing = await this.prisma.customerVehicle.findUnique({
      where: { customerId_vehicleId: { customerId, vehicleId } },
    });

    if (existing) {
      throw new ConflictException('Vehicle already assigned to this customer');
    }

    if (isPrimary) {
      await this.prisma.customerVehicle.updateMany({
        where: { customerId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerVehicle.create({
      data: {
        customerId,
        vehicleId,
        relationship: relationship ?? 'OWNER',
        isPrimary: isPrimary ?? false,
      },
      include: {
        vehicle: true,
      },
    });
  }

  async findVehicles(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });

    if (!customer || customer.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerVehicle.findMany({
      where: { customerId },
      include: {
        vehicle: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async unassignVehicle(customerId: string, vehicleId: string) {
    const existing = await this.prisma.customerVehicle.findUnique({
      where: { customerId_vehicleId: { customerId, vehicleId } },
    });

    if (!existing) {
      throw new NotFoundException('Vehicle assignment not found');
    }

    await this.prisma.customerVehicle.delete({
      where: { customerId_vehicleId: { customerId, vehicleId } },
    });

    return { message: 'Vehicle unassigned successfully' };
  }
}
