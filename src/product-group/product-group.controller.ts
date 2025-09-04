import { Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
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
  create(dto: CreateProductGroupDto) {
    return this.productGroupService.create(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Put()
  update(dto: UpdateProductGroupDto) {
    return this.productGroupService.update(dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.productGroupService.delete(id);
  }
}
