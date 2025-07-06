import { Module } from '@nestjs/common';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Group } from "./models/group.model";
import { Tag } from "./models/tag.model";
import { TagProduct } from "./models/tag-product.model";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([Group, Tag, TagProduct]),
    AuthModule,
  ],
  providers: [TagService],
  controllers: [TagController],
  exports: [TagService],
})
export class TagModule {}
