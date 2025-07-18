import { Module } from '@nestjs/common';
import { PromotionSliderService } from './promotion-slider.service';
import { PromotionSliderController } from './promotion-slider.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { SliderItem } from "./models/slider-item";
import { ImageModule } from "../image/image.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([SliderItem]),
    ImageModule,
    AuthModule
  ],
  providers: [PromotionSliderService],
  controllers: [PromotionSliderController]
})
export class PromotionSliderModule {}
