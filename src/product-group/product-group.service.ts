import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { ProductGroup } from "./models/product-group.model";
import { CreateProductGroupDto } from "./dto/create-product-group.dto";
import { UpdateProductGroupDto } from "./dto/update-product-group.dto";
import { Op } from "sequelize";

@Injectable()
export class ProductGroupService {

  constructor(
    @InjectModel(ProductGroup)
    private readonly productGroupRepository: typeof ProductGroup,
  ) {
  }

  async create(dto: CreateProductGroupDto) {
    const candidate = await this.productGroupRepository.findOne({ where: {name: dto.name} });

    if (candidate) {
      throw new BadRequestException("Product group with such name already exists");
    }

    return await this.productGroupRepository.create(dto);
  }

  async update(dto: UpdateProductGroupDto) {
    const candidate = await this.productGroupRepository.findOne({
      where: {
        name: dto.name,
        id: { [Op.ne]: dto.id }
      }
    });

    if (candidate) {
      throw new BadRequestException("Product group with such name already exists");
    }
  }

  async delete(id: number) {
    await this.productGroupRepository.destroy({ where: { id } });
  }
}
