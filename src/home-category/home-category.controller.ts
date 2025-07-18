import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post, Put, UploadedFile, UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { HomeCategoryService } from "./home-category.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('home-category')
export class HomeCategoryController {

  constructor(private readonly homeCategoryService: HomeCategoryService) {
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  createCategory(
    @Body() body: any,
    @UploadedFile() image?: Express.Multer.File
  ) {
    const dto: CreateCategoryDto = {
      groupId: Number(body.groupId),
      imageId: body.imageId ? Number(body.imageId) : undefined,
    }

    return this.homeCategoryService.create(dto, image);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.homeCategoryService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/:id')
  @UseInterceptors(FileInterceptor('image'))
  updateImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.homeCategoryService.updateImage(id, image);
  }

  @Get()
  getAllCategories() {
    return this.homeCategoryService.getAll();
  }
}
