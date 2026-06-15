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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a document record' })
  async create(
    @Body() dto: CreateDocumentDto,
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.create(dto, branchId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents for the current branch' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll(branchId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.documentsService.findById(id, branchId);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update document metadata' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.documentsService.update(id, dto, branchId);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft-delete a document' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.documentsService.softDelete(id, branchId);
  }
}
