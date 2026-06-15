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
import { ServicesCatalogService } from './services-catalog.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Services Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('services')
export class ServicesCatalogController {
  constructor(private readonly servicesCatalogService: ServicesCatalogService) {}

  @Post()
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Create a new service' })
  async create(
    @Body() dto: CreateServiceDto,
    @CurrentUser('branchId') userBranchId?: string,
  ) {
    if (!dto.branchId && userBranchId) {
      dto.branchId = userBranchId;
    }
    return this.servicesCatalogService.create(dto);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List services with search and pagination' })
  async findAll(@Query() query: QueryServiceDto) {
    return this.servicesCatalogService.findAll(query);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'Get service by ID' })
  async findOne(@Param('id') id: string) {
    return this.servicesCatalogService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update a service' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesCatalogService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft delete a service' })
  async remove(@Param('id') id: string) {
    return this.servicesCatalogService.remove(id);
  }
}
