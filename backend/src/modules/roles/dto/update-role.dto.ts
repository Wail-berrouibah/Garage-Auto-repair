import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class PermissionEntry {
  @IsString()
  resource: string;

  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  @IsIn(['GLOBAL', 'BRANCH', 'OWN'])
  scope?: string;
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({
    type: [PermissionEntry],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionEntry)
  permissions?: PermissionEntry[];
}
