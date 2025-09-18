import { Module } from '@nestjs/common';
import { PageBlockService } from './page-block.service';
import { PageBlockController } from './page-block.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { PageBlock } from "./models/page-block.model";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([PageBlock]),
    AuthModule
  ],
  providers: [PageBlockService],
  controllers: [PageBlockController]
})
export class PageBlockModule {}
