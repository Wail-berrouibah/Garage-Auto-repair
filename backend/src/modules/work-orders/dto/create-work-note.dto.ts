import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoteType } from '@prisma/client';

export class CreateWorkNoteDto {
  @ApiProperty({ enum: NoteType, default: 'INTERNAL' })
  @IsEnum(NoteType)
  noteType: NoteType;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  isPinned?: boolean;
}
