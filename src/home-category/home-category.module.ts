import { Module } from '@nestjs/common';
import { HomeCategoryController } from './home-category.controller';
import { HomeCategoryService } from './home-category.service';
import { HomeCategory } from "./models/home-category.model";
import { SequelizeModule } from "@nestjs/sequelize";
import { Preview } from "../product/models/preview.model";
import { Image } from "../image/models/image.model";
import { Group } from "../tags/models/group.model";
import { TagModule } from "../tags/tag.module";
import { ImageModule } from "../image/image.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([HomeCategory, Preview, Image, Group]),
    TagModule,
    ImageModule,
    AuthModule,
  ],
  controllers: [HomeCategoryController],
  providers: [HomeCategoryService]
})
export class HomeCategoryModule {}
