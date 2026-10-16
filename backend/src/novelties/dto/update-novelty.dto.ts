import { PartialType } from '@nestjs/swagger';
import { CreateNoveltyDto } from './create-novelty.dto';
export class UpdateNoveltyDto extends PartialType(CreateNoveltyDto) {}
