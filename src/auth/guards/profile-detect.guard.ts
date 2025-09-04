import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProfileJwtPayloadType } from '../payload-types/profile-payload.type';
import { ProfileStatusEnum } from '../../enums/profile-status.enum';
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "../../profile/models/profile.model";

@Injectable()
export class ProfileDetectGuard implements CanActivate {
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

    req.account = undefined;

    if (!auth) {
      return true;
    }

    const [bearer, token] = auth.split(' ');

    if (bearer !== 'Bearer' || !token) {
      return true;
    }

    try {
      const payload: ProfileJwtPayloadType | undefined = this.jwtService.verify(token);

      const profile = await this.profileRepository.findOne({
        where: {
          id: payload.uuid,
          type: payload.profileType,
          status: ProfileStatusEnum.ACTIVE,
        },
        raw: true,
      })

      if (!profile) {
        return true;
      }

      req.account = payload;
    } catch (e) {
      console.error(e);
    }

    return true;
  }
}