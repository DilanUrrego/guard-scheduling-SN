
import { PartialType } from '@nestjs/swagger';
import { CreateSecurityGuardDto } from './create-security-guard.dto';
export class UpdateSecurityGuardDto extends PartialType(CreateSecurityGuardDto) {}
