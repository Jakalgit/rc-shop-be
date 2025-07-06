import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Image } from "./models/image.model";
import { Preview } from "../product/models/preview.model";

@Module({
  imports: [
    SequelizeModule.forFeature([Image, Preview]),
  ],
  providers: [ImageService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
