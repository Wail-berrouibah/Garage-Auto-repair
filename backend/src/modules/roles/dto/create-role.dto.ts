import { IsString, IsArray, IsOptional, IsBoolean, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionEntry {
  @ApiProperty({ example: 'work_orders' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ example: 'BRANCH', default: 'BRANCH' })
  @IsOptional()
  @IsString()
  @IsIn(['GLOBAL', 'BRANCH', 'OWN'])
  scope?: string;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Branch manager role' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    type: [PermissionEntry],
    example: [{ resource: 'work_orders', action: 'read' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionEntry)
  permissions: PermissionEntry[];
}
