import { Module } from '@nestjs/common';
import { CategoryBlockController } from './category-block.controller';
import { CategoryBlockService } from './category-block.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { CategoryBlock } from "./models/category-block.model";
import { CategoryLink } from "./models/category-link.model";
import { CategorySubBlock } from "./models/category-subblock.model";
import { CategorySubBlockService } from "./category-sub-block.service";
import { CategoryBlockLinkService } from "./category-block-link.service";
import { CategoryBlockSharedService } from "./category-block-shared.service";
import { ImageModule } from "../image/image.module";
import { CategoryBlockGettersService } from "./category-block-getters.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([CategoryBlock, CategoryLink, CategorySubBlock]),
    ImageModule,
    AuthModule,
  ],
  providers: [CategoryBlockService, CategorySubBlockService, CategoryBlockLinkService, CategoryBlockSharedService, CategoryBlockGettersService],
  controllers: [CategoryBlockController]
})
export class CategoryBlockModule {}
