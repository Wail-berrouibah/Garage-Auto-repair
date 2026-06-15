import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { QueryReportDto } from './dto/query-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Financial report — revenue, invoicing, outstanding' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getFinancial(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getFinancial(branchId, query.from, query.to);
  }

  @Get('workshop')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Workshop report — status breakdown, labor, completion times' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getWorkshop(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getWorkshop(branchId, query.from, query.to);
  }

  @Get('mechanic')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Mechanic performance report' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getMechanic(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getMechanic(branchId, query.from, query.to);
  }

  @Get('inventory')
  @Roles('OWNER', 'MANAGER', 'INVENTORY_MANAGER')
  @ApiOperation({ summary: 'Inventory report — stock levels, low stock, category breakdown' })
  async getInventory(@CurrentUser('branchId') branchId: string) {
    return this.reportsService.getInventory(branchId);
  }

  @Get('customers')
  @Roles('OWNER', 'MANAGER')
  @ApiOperation({ summary: 'Customer report — totals, top customers' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async getCustomers(
    @CurrentUser('branchId') branchId: string,
    @Query() query: QueryReportDto,
  ) {
    return this.reportsService.getCustomers(branchId, query.from, query.to);
  }
}
