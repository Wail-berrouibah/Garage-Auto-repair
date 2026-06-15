import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: '1HGCM82633A004352' })
  @IsString()
  vin: string;

  @ApiPropertyOptional({ example: 'ABC-1234' })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ example: 'CA' })
  @IsOptional()
  @IsString()
  licenseState?: string;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'Accord' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsInt()
  @Min(1886)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ example: 'EX-L' })
  @IsOptional()
  @IsString()
  trimLevel?: string;

  @ApiPropertyOptional({ example: '2.4L I4' })
  @IsOptional()
  @IsString()
  engine?: string;

  @ApiPropertyOptional({ example: 'Automatic' })
  @IsOptional()
  @IsString()
  transmission?: string;

  @ApiPropertyOptional({ example: 'FWD' })
  @IsOptional()
  @IsString()
  drivetrain?: string;

  @ApiPropertyOptional({ example: 'Gasoline' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 'White' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'Sedan' })
  @IsOptional()
  @IsString()
  bodyClass?: string;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @IsInt()
  @Min(1886)
  @Max(2030)
  manufactureYear?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  odometer?: number;

  @ApiPropertyOptional({ example: 'mi' })
  @IsOptional()
  @IsString()
  @IsIn(['mi', 'km'])
  odometerUnit?: string;

  @ApiPropertyOptional({ example: 'Customer vehicle notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
