import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { Detail } from "./models/detail.model";
import { Preview } from "./models/preview.model";
import { Product } from "./models/product.model";
import { Image } from "../image/models/image.model";
import { TagModule } from "../tags/tag.module";
import { ImageModule } from "../image/image.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([Detail, Product, Preview, Image]),
    TagModule,
    ImageModule,
    AuthModule
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
