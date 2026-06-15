import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SuppliersService } from '../services/suppliers.service';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';
import { QuerySupplierDto } from '../dto/query-supplier.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Create a supplier' })
  async create(@Body() dto: CreateSupplierDto, @CurrentUser('branchId') userBranchId?: string) {
    if (!dto.branchId && userBranchId) dto.branchId = userBranchId;
    return this.suppliersService.create(dto);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'List suppliers' })
  async findAll(@Query() query: QuerySupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Get supplier by ID' })
  async findOne(@Param('id') id: string) {
    return this.suppliersService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update a supplier' })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Soft delete a supplier' })
  async remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
