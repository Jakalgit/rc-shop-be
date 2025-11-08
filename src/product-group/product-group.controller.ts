import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ProductGroupService } from "./product-group.service";
import { CreateProductGroupDto } from "./dto/create-product-group.dto";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { UpdateProductGroupDto } from "./dto/update-product-group.dto";

@Controller('product-group')
export class ProductGroupController {

  constructor(
    private readonly productGroupService: ProductGroupService
  ) {}

  @UseGuards(AdminAuthGuard)
  @Post()
  create(@Body() dto: CreateProductGroupDto) {
    return this.productGroupService.create(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Put('/update')
  update(@Body() dto: UpdateProductGroupDto) {
    return this.productGroupService.update(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/list')
  getProductGroups(
    @Query('page') page: number = 1,
    @Query('pageCount') pageCount: number = 1,
    @Query('finder') finder: string,
  ) {
    return this.productGroupService.getProductGroups({ page, pageCount, finder })
  }

  @UseGuards(AdminAuthGuard)
  @Get('/single/:groupId')
  getSingleGroup(@Param('groupId') groupId: number) {
    return this.productGroupService.getSingleProductGroup(groupId);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('/remove/:id')
  delete(@Param('id') id: number) {
    return this.productGroupService.delete(id);
  }
}
