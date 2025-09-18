import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { PageBlockService } from "./page-block.service";
import { UpdatePageBlockDto } from "./dto/create-page-block.dto";
import { PageEnum } from "./enums/page-type.enum";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";

@Controller('page-block')
export class PageBlockController {

  constructor(
    private readonly pageBlockService: PageBlockService,
  ) {
  }

  @UseGuards(AdminAuthGuard)
  @Post()
  updatePageBlocks(@Body() dto: UpdatePageBlockDto) {
    return this.pageBlockService.updateBlocks(dto);
  }

  @Get('/:pageType')
  getPageBlocks(@Param('pageType') pageType: PageEnum) {
    return this.pageBlockService.getPageBlockByPage(pageType);
  }
}
