import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthJwtPayload } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthJwtPayload => {
    const request = context.switchToHttp().getRequest<{ user: AuthJwtPayload }>();
    return request.user;
  },
);
