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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Create a new vehicle' })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.vehiclesService.create(dto, branchId);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('search') search?: string,
  ) {
    return this.vehiclesService.findAll(pagination, search);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Get vehicle by ID with customer count' })
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER', 'MECHANIC')
  @ApiOperation({ summary: 'Update vehicle' })
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Delete vehicle (soft)' })
  async remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
