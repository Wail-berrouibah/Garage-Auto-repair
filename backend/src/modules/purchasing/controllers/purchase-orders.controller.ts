import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseOrdersService } from '../services/purchase-orders.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from '../dto/update-purchase-order.dto';
import { UpdatePoStatusDto } from '../dto/update-po-status.dto';
import { QueryPurchaseOrderDto } from '../dto/query-purchase-order.dto';
import { CreatePoLineItemDto } from '../dto/create-po-line-item.dto';
import { UpdatePoLineItemDto } from '../dto/update-po-line-item.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Create a purchase order with line items' })
  async create(@Body() dto: CreatePurchaseOrderDto, @CurrentUser() user: any) {
    if (!dto.branchId && user.branchId) dto.branchId = user.branchId;
    return this.purchaseOrdersService.create(dto, user.id);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'List purchase orders' })
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrdersService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Get purchase order by ID with line items' })
  async findOne(@Param('id') id: string) {
    return this.purchaseOrdersService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update purchase order header (DRAFT only)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update purchase order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePoStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.purchaseOrdersService.updateStatus(id, dto, userId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Soft delete a purchase order' })
  async remove(@Param('id') id: string) {
    return this.purchaseOrdersService.remove(id);
  }

  @Post(':id/items')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Add a line item to a purchase order' })
  async addLineItem(@Param('id') id: string, @Body() dto: CreatePoLineItemDto) {
    return this.purchaseOrdersService.addLineItem(id, dto);
  }

  @Patch(':id/items/:itemId')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Update a line item' })
  async updateLineItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePoLineItemDto,
  ) {
    return this.purchaseOrdersService.updateLineItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Remove a line item' })
  async removeLineItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.purchaseOrdersService.removeLineItem(id, itemId);
  }
}
