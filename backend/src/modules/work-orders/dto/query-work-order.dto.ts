import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WoStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryWorkOrderDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: WoStatus })
  @IsOptional()
  @IsEnum(WoStatus)
  status?: WoStatus;

  @ApiPropertyOptional({ enum: WoStatus })
  @IsOptional()
  @IsEnum(WoStatus)
  notStatus?: WoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}
