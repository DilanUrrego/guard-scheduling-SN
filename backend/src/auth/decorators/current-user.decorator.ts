
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Uso: @CurrentUser() user: { id, email, role }
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);