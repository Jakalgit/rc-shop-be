import { Module } from '@nestjs/common';
import { RepairServiceController } from './repair-service.controller';
import { RepairService_Service } from './repair-service.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { RepairService } from "./models/repair-service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([RepairService]),
    AuthModule,
  ],
  controllers: [RepairServiceController],
  providers: [RepairService_Service]
})
export class RepairServiceModule {}
