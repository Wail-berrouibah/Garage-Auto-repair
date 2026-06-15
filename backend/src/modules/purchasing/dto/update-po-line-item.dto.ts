import { PartialType } from '@nestjs/swagger';
import { CreatePoLineItemDto } from './create-po-line-item.dto';

export class UpdatePoLineItemDto extends PartialType(CreatePoLineItemDto) {}
