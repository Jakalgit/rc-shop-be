import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Image } from "./models/image.model";

@Module({
  imports: [
    SequelizeModule.forFeature([Image]),
  ],
  providers: [ImageService],
  controllers: [ImageController],
  exports: [ImageService],
})
export class ImageModule {}
