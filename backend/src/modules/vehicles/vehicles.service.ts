import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto, branchId: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { vin: dto.vin },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('VIN already exists');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        branchId,
        vin: dto.vin,
        licensePlate: dto.licensePlate,
        licenseState: dto.licenseState,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        trimLevel: dto.trimLevel,
        engine: dto.engine,
        transmission: dto.transmission,
        drivetrain: dto.drivetrain,
        fuelType: dto.fuelType,
        color: dto.color,
        bodyClass: dto.bodyClass,
        manufactureYear: dto.manufactureYear,
        odometer: dto.odometer,
        odometerUnit: dto.odometerUnit,
        notes: dto.notes,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    this.logger.log(`Vehicle created: ${vehicle.vin}`);
    return vehicle;
  }

  async findAll(pagination: PaginationQueryDto, search?: string) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { vin: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, totalCount] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          branch: { select: { id: true, name: true } },
          _count: {
            select: {
              customers: { where: { customer: { deletedAt: null } } },
              workOrders: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
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
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            customers: { where: { customer: { deletedAt: null } } },
            workOrders: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!vehicle || vehicle.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!vehicle || vehicle.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    if (dto.vin) {
      const duplicate = await this.prisma.vehicle.findUnique({
        where: { vin: dto.vin },
        select: { id: true },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException('VIN already exists');
      }
    }

    const updateData: Partial<Prisma.VehicleUpdateInput> = {};
    if (dto.vin !== undefined) updateData.vin = dto.vin;
    if (dto.licensePlate !== undefined) updateData.licensePlate = dto.licensePlate;
    if (dto.licenseState !== undefined) updateData.licenseState = dto.licenseState;
    if (dto.make !== undefined) updateData.make = dto.make;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.trimLevel !== undefined) updateData.trimLevel = dto.trimLevel;
    if (dto.engine !== undefined) updateData.engine = dto.engine;
    if (dto.transmission !== undefined) updateData.transmission = dto.transmission;
    if (dto.drivetrain !== undefined) updateData.drivetrain = dto.drivetrain;
    if (dto.fuelType !== undefined) updateData.fuelType = dto.fuelType;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.bodyClass !== undefined) updateData.bodyClass = dto.bodyClass;
    if (dto.manufactureYear !== undefined) updateData.manufactureYear = dto.manufactureYear;
    if (dto.odometer !== undefined) updateData.odometer = dto.odometer;
    if (dto.odometerUnit !== undefined) updateData.odometerUnit = dto.odometerUnit;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: {
            customers: { where: { customer: { deletedAt: null } } },
            workOrders: { where: { deletedAt: null } },
          },
        },
      },
    });
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!vehicle || vehicle.deletedAt) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Vehicle soft-deleted: ${id}`);
    return { message: 'Vehicle deleted successfully' };
  }
}
