import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './services/inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Create a new stock item' })
  async create(@Body() dto: CreateInventoryDto) {
    return this.inventoryService.create(dto);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List stock items with search and pagination' })
  async findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'Get stock item by ID' })
  async findOne(@Param('id') id: string) {
    return this.inventoryService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update a stock item' })
  async update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Soft delete a stock item' })
  async remove(@Param('id') id: string) {
    return this.inventoryService.remove(id);
  }

  @Post(':id/adjust')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Adjust stock quantity (positive or negative)' })
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustInventoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.adjustStock(id, dto, userId);
  }
}
