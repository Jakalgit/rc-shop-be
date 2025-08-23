import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AdditionalBodyDataType } from "../types/additional-body-data.type";

export const WholesalePriceAccess = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const request: AdditionalBodyDataType = ctx.switchToHttp().getRequest();
    return !!request.wholesalePriceAccess;
  }
)