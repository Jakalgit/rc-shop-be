import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginAdminDto } from './dto/login-admin.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginProfileDto } from './dto/login-profile.dto';
import { Profile } from '../profile/models/profile.model';
import * as bcrypt from 'bcrypt';
import { ProfileJwtPayloadType } from './payload-types/profile-payload.type';
import { ProfileEnum } from '../enums/profile.enum';
import { AdminPayloadType } from "./payload-types/admin-payload.type";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async loginAdmin(dto: LoginAdminDto) {
    const LOGIN = this.configService.get<string>('ADM_L');
    const PASSWORD = this.configService.get<string>('ADM_P');

    if (dto.password === PASSWORD && dto.login === LOGIN) {
      const payload: AdminPayloadType = {
        time: Date.now(),
        admin: true,
      }

      return {
        act: this.createToken(payload),
      };
    } else {
      throw new BadRequestException('Неверные данные входа');
    }
  }

  async loginProfile(dto: LoginProfileDto, profile: Profile) {
    const passwordMatches = await bcrypt.compare(
      dto.password,
      profile.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const payload: ProfileJwtPayloadType = {
      uuid: profile.id,
      profileType: ProfileEnum.PARTNER,
    };

    return this.createToken(payload);
  }

  private createToken(payload: any) {
    return this.jwtService.sign(payload);
  }
}