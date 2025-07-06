import { Module } from '@nestjs/common';
import { UserRequestController } from './user-request.controller';
import { UserRequestService } from './user-request.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { UserRequest } from "./models/user-request.model";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([UserRequest]),
    AuthModule
  ],
  controllers: [UserRequestController],
  providers: [UserRequestService]
})
export class UserRequestModule {}
