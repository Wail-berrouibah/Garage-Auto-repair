import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Branch code already in use');
    }

    const branch = await this.prisma.branch.create({
      data: dto,
    });

    this.logger.log(`Branch created: ${branch.code} (${branch.name})`);
    return branch;
  }

  async findAll(search?: string) {
    return this.prisma.branch.findMany({
      where: {
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { state: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    if (dto.code && dto.code !== branch.code) {
      const existing = await this.prisma.branch.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Branch code already in use');
      }
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: dto,
    });

    this.logger.log(`Branch updated: ${updated.code}`);
    return updated;
  }

  async softDelete(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });

    if (!branch || branch.deletedAt) {
      throw new NotFoundException('Branch not found');
    }

    const deleted = await this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Branch soft-deleted: ${deleted.code}`);
    return deleted;
  }
}
