import { Controller, Get, Query } from "@nestjs/common";
import { ImageService } from "./image.service";

@Controller('image')
export class ImageController {

  constructor(private readonly imageService: ImageService) {}

  @Get('/paginate')
  getImages(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 1,
  ) {
    return this.imageService.getImages(page, limit);
  }
}
