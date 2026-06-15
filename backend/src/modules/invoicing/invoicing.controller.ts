import {
  Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicingService } from './invoicing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { CreateInvoiceLineDto } from './dto/create-invoice-line.dto';
import { UpdateInvoiceLineDto } from './dto/update-invoice-line.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Invoicing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Create an invoice from a work order' })
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: any) {
    if (!dto.branchId && user.branchId) dto.branchId = user.branchId;
    return this.invoicingService.create(dto);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'List invoices' })
  async findAll(@Query() query: QueryInvoiceDto) {
    return this.invoicingService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get invoice by ID with lines and payments' })
  async findOne(@Param('id') id: string) {
    return this.invoicingService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update invoice header (DRAFT only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicingService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update invoice status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
    return this.invoicingService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Soft delete an invoice' })
  async remove(@Param('id') id: string) {
    return this.invoicingService.remove(id);
  }

  @Post(':id/lines')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Add a line to an invoice' })
  async addLine(@Param('id') id: string, @Body() dto: CreateInvoiceLineDto) {
    return this.invoicingService.addLine(id, dto);
  }

  @Patch(':id/lines/:lineId')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Update an invoice line' })
  async updateLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateInvoiceLineDto,
  ) {
    return this.invoicingService.updateLine(id, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  @Roles('OWNER', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Remove an invoice line' })
  async removeLine(@Param('id') id: string, @Param('lineId') lineId: string) {
    return this.invoicingService.removeLine(id, lineId);
  }
}
