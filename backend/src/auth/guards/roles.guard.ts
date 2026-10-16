
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true; // Sin @Roles() → ruta pública (tras JWT válido)

    const { user } = ctx.switchToHttp().getRequest();
    if (!required.includes(user.role)) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción');
    }
    return true;
  }
}

