import { PartialType } from '@nestjs/swagger';
import { CreateRestDto } from './create-rest.dto';
export class UpdateRestDto extends PartialType(CreateRestDto) {}