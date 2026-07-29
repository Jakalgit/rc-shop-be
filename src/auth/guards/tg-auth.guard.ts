import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { parse, validate } from '@telegram-apps/init-data-node';
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TgAuthGuard implements CanActivate {

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    try {
      const authHeader = req.headers['authorization'];
      const bearer = authHeader.split(' ')[0];
      const queryData = authHeader.split(' ')[1];

      const BOT_TOKEN = this.configService.get<string>('CHAT_BOT_TOKEN');

      if (bearer !== 'TgBearer' || !queryData) {
        return false;
      }

      validate(queryData, BOT_TOKEN);

      const tgData = parse(queryData);
      const admins: number[] = JSON.parse(this.configService.get('HOLDERS_PEER_IDS'));

      return admins.includes(tgData.user.id);
    } catch (error) {
      return false;
    }
  }
}