import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// PartialType hace todos los campos opcionales y hereda las validaciones
export class UpdateUserDto extends PartialType(CreateUserDto) {}