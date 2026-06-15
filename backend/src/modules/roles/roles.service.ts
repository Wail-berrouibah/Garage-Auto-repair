import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name as RoleName },
    });

    if (existing) {
      throw new ConflictException('Role name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name as RoleName,
        description: dto.description,
        isSystem: dto.isSystem ?? false,
        permissions: {
          create: dto.permissions.map((p) => ({
            resource: p.resource,
            action: p.action,
            scope: p.scope ?? 'BRANCH',
          })),
        },
      },
      include: {
        permissions: true,
      },
    });

    return role;
  }

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (dto.name) {
      const existing = await this.prisma.role.findUnique({
        where: { name: dto.name as RoleName },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name as RoleName;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isSystem !== undefined) updateData.isSystem = dto.isSystem;

    if (dto.permissions) {
      await this.prisma.permission.deleteMany({ where: { roleId: id } });
      await this.prisma.permission.createMany({
        data: dto.permissions.map((p) => ({
          roleId: id,
          resource: p.resource,
          action: p.action,
          scope: p.scope ?? 'BRANCH',
        })),
      });
    }

    return this.prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: true,
      },
    });
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new ConflictException('Cannot delete system role');
    }

    if (role._count.users > 0) {
      throw new ConflictException(
        'Cannot delete role assigned to users. Remove all user assignments first.',
      );
    }

    await this.prisma.permission.deleteMany({ where: { roleId: id } });
    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role deleted successfully' };
  }
}
