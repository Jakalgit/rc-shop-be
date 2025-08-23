import { Controller, Delete, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ProductGroupService } from "./product-group.service";
import { CreateProductGroupDto } from "./dto/create-product-group.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateProductGroupDto } from "./dto/update-product-group.dto";

@Controller('product-group')
export class ProductGroupController {

  constructor(
    private readonly productGroupService: ProductGroupService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(dto: CreateProductGroupDto) {
    return this.productGroupService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  update(dto: UpdateProductGroupDto) {
    return this.productGroupService.update(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id')
  delete(@Param('id') id: number) {
    return this.productGroupService.delete(id);
  }
}
