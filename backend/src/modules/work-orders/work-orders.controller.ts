import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkOrdersService } from './work-orders.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Work Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Create a new work order' })
  async create(
    @Body() dto: CreateWorkOrderDto,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.create(dto, branchId, userId);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List work orders with search, filter, and pagination' })
  async findAll(
    @Query() query: QueryWorkOrderDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.workOrdersService.findAll(query, branchId);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'Get work order by ID with all relations' })
  async findOne(@Param('id') id: string) {
    return this.workOrdersService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update work order fields' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft delete work order' })
  async remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update work order status with history tracking' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkOrderStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.updateStatus(id, dto, userId);
  }

  @Get(':id/status-history')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'Get status change history for work order' })
  async getStatusHistory(@Param('id') id: string) {
    return this.workOrdersService.getStatusHistory(id);
  }

  // ---- Labor Entries ----

  @Post(':id/labor')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Add labor entry to work order' })
  async createLaborEntry(
    @Param('id') id: string,
    @Body() dto: CreateLaborEntryDto,
  ) {
    return this.workOrdersService.createLaborEntry(id, dto);
  }

  @Get(':id/labor')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List labor entries for work order' })
  async findLaborEntries(@Param('id') id: string) {
    return this.workOrdersService.findLaborEntries(id);
  }

  @Patch(':id/labor/:laborId')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update labor entry' })
  async updateLaborEntry(
    @Param('id') id: string,
    @Param('laborId') laborId: string,
    @Body() dto: UpdateLaborEntryDto,
  ) {
    return this.workOrdersService.updateLaborEntry(id, laborId, dto);
  }

  @Delete(':id/labor/:laborId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove labor entry' })
  async removeLaborEntry(
    @Param('id') id: string,
    @Param('laborId') laborId: string,
  ) {
    return this.workOrdersService.removeLaborEntry(id, laborId);
  }

  // ---- Part Entries ----

  @Post(':id/parts')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Add part entry to work order' })
  async createPartEntry(
    @Param('id') id: string,
    @Body() dto: CreatePartEntryDto,
  ) {
    return this.workOrdersService.createPartEntry(id, dto);
  }

  @Get(':id/parts')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List part entries for work order' })
  async findPartEntries(@Param('id') id: string) {
    return this.workOrdersService.findPartEntries(id);
  }

  @Patch(':id/parts/:partId')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update part entry' })
  async updatePartEntry(
    @Param('id') id: string,
    @Param('partId') partId: string,
    @Body() dto: UpdatePartEntryDto,
  ) {
    return this.workOrdersService.updatePartEntry(id, partId, dto);
  }

  @Delete(':id/parts/:partId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove part entry' })
  async removePartEntry(
    @Param('id') id: string,
    @Param('partId') partId: string,
  ) {
    return this.workOrdersService.removePartEntry(id, partId);
  }

  // ---- Time Entries ----

  @Post(':id/time')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Clock in mechanic on work order' })
  async clockIn(
    @Param('id') id: string,
    @Body() dto: CreateTimeEntryDto,
  ) {
    return this.workOrdersService.clockIn(id, dto);
  }

  @Post(':id/time/:timeId/clock-out')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Clock out mechanic from work order' })
  async clockOut(
    @Param('id') id: string,
    @Param('timeId') timeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.clockOut(id, timeId, userId);
  }

  @Get(':id/time')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List time entries for work order' })
  async findTimeEntries(@Param('id') id: string) {
    return this.workOrdersService.findTimeEntries(id);
  }

  // ---- Work Notes ----

  @Post(':id/notes')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'Add note to work order' })
  async createWorkNote(
    @Param('id') id: string,
    @Body() dto: CreateWorkNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.workOrdersService.createWorkNote(id, dto, userId);
  }

  @Get(':id/notes')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List notes for work order' })
  async findWorkNotes(@Param('id') id: string) {
    return this.workOrdersService.findWorkNotes(id);
  }

  @Delete(':id/notes/:noteId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete work note' })
  async removeWorkNote(
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    return this.workOrdersService.removeWorkNote(id, noteId);
  }
}
