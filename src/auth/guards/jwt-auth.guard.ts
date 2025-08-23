import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminPayloadType } from "../payload-types/admin-payload.type";

@Injectable()
export class JwtAuthGuard implements CanActivate {

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    try {
      const authHeader = req.headers['authorization'];
      const bearer = authHeader.split(' ')[0];
      const token = authHeader.split(' ')[1];

      if (bearer !== 'Bearer' || !token) {
        return false;
      }

      let payload: AdminPayloadType;

      payload = this.jwtService.verify(token);

      if (!payload.admin) {
        return false;
      }

      req.account = payload;
      req.wholesalePriceAccsess = true;

      return true
    } catch {
      throw new UnauthorizedException();
    }
  }
}