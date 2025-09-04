import { Body, Controller, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { PromotionSliderService } from "./promotion-slider.service";
import { FilesInterceptor } from "@nestjs/platform-express";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { UpdateSliderDto } from "./dto/update-slider.dto";

@Controller('promotion-slider')
export class PromotionSliderController {

  constructor(
    private readonly promotionSliderService: PromotionSliderService
  ) {}

  @UseGuards(AdminAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files[]', 30))
  update(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any
  ) {

    const dto: UpdateSliderDto = {
      items: JSON.parse(body.items),
    }

    return this.promotionSliderService.update(dto, files);
  }

  @Get()
  getSlides() {
    return this.promotionSliderService.getSliders();
  }
}
