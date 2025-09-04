import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ProfileId = createParamDecorator(
  (_, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request?.account?.uuid;
  }
)