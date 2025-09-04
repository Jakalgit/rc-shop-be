import { Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { ProfileController } from './profile.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Profile } from "./models/profile.model";
import { AuthModule } from "../auth/auth.module";
import { ProfileUpdatesService } from "./services/profile-updates.service";
import { MailerModule } from "../mailer/mailer.module";
import { ProfileGettersService } from "./services/profile-getters.service";

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Profile]),
    MailerModule,
  ],
  providers: [ProfileService, ProfileUpdatesService, ProfileGettersService],
  controllers: [ProfileController],
  exports: [ProfileService, ProfileGettersService],
})
export class ProfileModule {}
