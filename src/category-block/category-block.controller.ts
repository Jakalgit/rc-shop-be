import { Body, Controller, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { UpdateCategoryBlockDto } from "./dto/update-category-block.dto";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CategoryBlockService } from "./category-block.service";
import { CategoryBlockGettersService } from "./category-block-getters.service";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";

@Controller('category-block')
export class CategoryBlockController {

  constructor(
    private readonly categoryBlockService: CategoryBlockService,
    private readonly categoryBlockGettersService: CategoryBlockGettersService
  ) {
  }

  @UseGuards(AdminAuthGuard)
  @Post('/update')
  @UseInterceptors(FilesInterceptor('files', 50))
  updateCategoryBlocks(
    @Body() dto: UpdateCategoryBlockDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.categoryBlockService.updateCategoryBlocks(dto, files);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/adm')
  getCategoryBlocksAdm() {
    return this.categoryBlockGettersService.getCategoryBlocksAdm();
  }

  @Get('/usr')
  getCategoryBlockUsr() {
    return this.categoryBlockGettersService.getCategoryBlocksUsr();
  }
}
