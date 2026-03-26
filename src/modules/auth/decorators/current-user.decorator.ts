import { UserModel } from '@/generated/prisma/models';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserModel | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UserModel | undefined;
  },
);
