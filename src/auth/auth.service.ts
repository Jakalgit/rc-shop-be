import { BadRequestException, Injectable } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const LOGIN = this.configService.get<string>('ADM_L');
    const PASSWORD = this.configService.get<string>('ADM_P');

    if (dto.password === PASSWORD && dto.login === LOGIN) {
      return {
        act: this.createToken(),
      }
    } else {
      throw new BadRequestException("Invalid credentials");
    }
  }

  private createToken() {
    const payload = {
      time: Date.now(),
    }

    return this.jwtService.sign(payload);
  }
}