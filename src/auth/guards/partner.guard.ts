import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileEnum } from '../../enums/profile.enum';
import { ProfileJwtPayloadType } from '../payload-types/profile-payload.type';
import { ProfileStatusEnum } from '../../enums/profile-status.enum';
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "../../profile/models/profile.model";

@Injectable()
export class PartnerGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Profile)
    private readonly profileRepository: typeof Profile,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];

    req.wholesalePriceAccess = false;
    req.account = undefined;

    if (!auth) {
      return true;
    }

    const [bearer, token] = auth.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return true;
    }

    try {
      const payload: ProfileJwtPayloadType = this.jwtService.verify(token);
      if (payload.profileType !== ProfileEnum.PARTNER) {
        return true;
      }

      const profile = await this.profileRepository.findOne({
        where: {
          id: payload.uuid,
          type: payload.profileType,
          status: ProfileStatusEnum.ACTIVE,
        }
      })
      if (!profile) {
        return true;
      }
      req.account = payload;
      req.wholesalePriceAccess = true;
    } catch (e) {
      console.error(e);
    }

    return true;
  }
}