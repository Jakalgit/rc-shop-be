import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { ProductGroup } from "./models/product-group.model";
import { CreateProductGroupDto } from "./dto/create-product-group.dto";
import { UpdateProductGroupDto } from "./dto/update-product-group.dto";
import { Op } from "sequelize";
import { GetProductGroupDto } from "./dto/get-product-group.dto";

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
      throw new BadRequestException('Товарная группа с таким именем уже существует');
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
    
    await this.productGroupRepository.update({ name: dto.name }, { where: { id: dto.id } });
  }

  async delete(id: number) {
    await this.productGroupRepository.destroy({ where: { id } });
  }

  async getSingleProductGroup(id: number) {
    const group = await this.productGroupRepository.findByPk(id, { raw: true });

    if (!group) {
      throw new NotFoundException('Товарная гуппа не найдена');
    }

    return group;
  }

  async getProductGroups(dto: GetProductGroupDto) {
    let options = {};

    if (dto.finder.length > 0) {
      options['name'] = { [Op.iLike]: `%${dto.finder}%` }
    }

    const groups = await this.productGroupRepository.findAndCountAll({
      where: options,
      limit: dto.pageCount,
      offset: (dto.page - 1) * dto.pageCount,
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      },
      raw: true,
    });

    // Общее количество записей
    const totalRecords = groups.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / dto.pageCount);

    return {
      records: groups.rows,
      totalPages,
    }
  }
}
