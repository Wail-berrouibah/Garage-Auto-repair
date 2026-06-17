import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({ example: 'newemail@example.com' })
  @IsEmail()
  newEmail: string;

  @ApiProperty({ example: 'current-password' })
  @IsString()
  password: string;
}
