import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AdminAuthGuard } from "./guards/admin-auth.guard";
import { SequelizeModule } from "@nestjs/sequelize";
import { Profile } from "../profile/models/profile.model";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '7d' }
      }),
    }),
    SequelizeModule.forFeature([Profile])
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminAuthGuard],
  exports: [JwtModule, AdminAuthGuard, AuthService]
})
export class AuthModule {}