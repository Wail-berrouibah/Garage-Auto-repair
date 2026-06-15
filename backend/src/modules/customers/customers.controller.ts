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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Create a new customer' })
  async create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.customersService.create(dto, branchId);
  }

  @Get()
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'List all customers with search and pagination' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(pagination, search);
  }

  @Get(':id')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Get customer by ID with vehicles and work orders count' })
  async findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Update customer' })
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Soft delete customer' })
  async remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  @Post(':id/vehicles')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST')
  @ApiOperation({ summary: 'Assign vehicle to customer' })
  async assignVehicle(
    @Param('id') id: string,
    @Body() body: { vehicleId: string; relationship?: string; isPrimary?: boolean },
  ) {
    return this.customersService.assignVehicle(id, body.vehicleId, body.relationship, body.isPrimary);
  }

  @Get(':id/vehicles')
  @Roles('OWNER', 'MANAGER', 'RECEPTIONIST', 'MECHANIC')
  @ApiOperation({ summary: 'List vehicles for customer' })
  async findVehicles(@Param('id') id: string) {
    return this.customersService.findVehicles(id);
  }

  @Delete(':customerId/vehicles/:vehicleId')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Unassign vehicle from customer' })
  async unassignVehicle(
    @Param('customerId') customerId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.customersService.unassignVehicle(customerId, vehicleId);
  }
}
