import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WoStatus } from '@prisma/client';

export class UpdateWorkOrderStatusDto {
  @ApiProperty({ enum: WoStatus })
  @IsEnum(WoStatus)
  status: WoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
