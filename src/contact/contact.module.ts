import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { Contact } from "./models/contact.model";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([Contact]),
    AuthModule,
  ],
  controllers: [ContactController],
  providers: [ContactService]
})
export class ContactModule {}
