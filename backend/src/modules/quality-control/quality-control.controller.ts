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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QualityControlService } from './quality-control.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { QueryChecklistTemplateDto } from './dto/query-checklist-template.dto';
import { CreateQcInspectionDto } from './dto/create-qc-inspection.dto';
import { UpdateQcInspectionDto } from './dto/update-qc-inspection.dto';
import { QueryQcInspectionDto } from './dto/query-qc-inspection.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Quality Control')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('qc')
export class QualityControlController {
  constructor(private readonly qcService: QualityControlService) {}

  // ==================== CHECKLIST TEMPLATES ====================

  @Post('templates')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a new checklist template with optional items' })
  async createTemplate(
    @Body() dto: CreateChecklistTemplateDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.qcService.createTemplate(dto, branchId);
  }

  @Get('templates')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'List checklist templates with search and pagination' })
  async findAllTemplates(
    @Query() query: QueryChecklistTemplateDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.qcService.findAllTemplates(query, branchId);
  }

  @Get('templates/:id')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get checklist template by ID with items' })
  async findTemplateById(@Param('id') id: string) {
    return this.qcService.findTemplateById(id);
  }

  @Patch('templates/:id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update checklist template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistTemplateDto,
  ) {
    return this.qcService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft delete checklist template' })
  async removeTemplate(@Param('id') id: string) {
    return this.qcService.removeTemplate(id);
  }

  // ==================== CHECKLIST ITEMS ====================

  @Post('templates/:templateId/items')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Add an item to a checklist template' })
  async addTemplateItem(
    @Param('templateId') templateId: string,
    @Body() dto: { description: string; isRequired?: boolean; sortOrder?: number },
  ) {
    return this.qcService.addTemplateItem(
      templateId,
      dto.description,
      dto.isRequired,
      dto.sortOrder,
    );
  }

  @Patch('templates/:templateId/items/:itemId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a checklist item' })
  async updateTemplateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.qcService.updateTemplateItem(itemId, dto);
  }

  @Delete('templates/:templateId/items/:itemId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Remove a checklist item' })
  async removeTemplateItem(@Param('itemId') itemId: string) {
    return this.qcService.removeTemplateItem(itemId);
  }

  // ==================== QC INSPECTIONS ====================

  @Post('inspections')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Create a new QC inspection for a work order' })
  async createInspection(
    @Body() dto: CreateQcInspectionDto,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.qcService.createInspection(dto, branchId, userId);
  }

  @Get('inspections')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'List QC inspections with search and pagination' })
  async findAllInspections(
    @Query() query: QueryQcInspectionDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.qcService.findAllInspections(query, branchId);
  }

  @Get('inspections/:id')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get QC inspection by ID with all checks' })
  async findInspectionById(@Param('id') id: string) {
    return this.qcService.findInspectionById(id);
  }

  @Patch('inspections/:id')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update QC inspection result/notes' })
  async updateInspection(
    @Param('id') id: string,
    @Body() dto: UpdateQcInspectionDto,
  ) {
    return this.qcService.updateInspection(id, dto);
  }

  @Patch('inspections/checks/:checkId')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update an individual QC check result' })
  async updateCheck(
    @Param('checkId') checkId: string,
    @Body() dto: { passed: boolean; notes?: string },
  ) {
    return this.qcService.updateCheck(checkId, dto.passed, dto.notes);
  }

  @Get('work-orders/:workOrderId/inspections')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get all inspections for a specific work order' })
  async findInspectionsByWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.qcService.findInspectionsByWorkOrder(workOrderId);
  }
}
