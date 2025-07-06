import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { HomeCategory } from "./models/home-category.model";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { ImageService } from "../image/image.service";
import { Sequelize } from "sequelize-typescript";
import { Preview } from "../product/models/preview.model";
import { Image } from "../image/models/image.model";
import { Op } from "sequelize";
import { Group } from "../tags/models/group.model";
import { TagService } from "../tags/tag.service";

@Injectable()
export class HomeCategoryService {

  constructor(
    @InjectModel(HomeCategory)
    private readonly homeCategoryRepository: typeof HomeCategory,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
    @InjectModel(Image)
    private readonly imageRepository: typeof Image,
    @InjectModel(Group)
    private readonly groupRepository: typeof Group,
    private readonly imageService: ImageService,
    private readonly tagService: TagService,
    private readonly sequelize: Sequelize,
  ) {
  }

  async create(dto: CreateCategoryDto, file?: Express.Multer.File) {
    const candidate = await this.homeCategoryRepository.findOne({
      where: { groupId: dto.groupId },
      raw: true
    });

    if (candidate) {
      throw new BadRequestException("Home group with such groupId already exists");
    }

    if (typeof dto.imageId === 'number') {
      return await this.homeCategoryRepository.create(dto);
    } else if (file) {
      const transaction = await this.sequelize.transaction();
      try {
        const image = await this.imageService.createImage({image: file, transaction});
        const group = await this.homeCategoryRepository.create({ groupId: dto.groupId, imageId: image.id }, {transaction});

        await transaction.commit();

        return group.dataValues;
      } catch (e) {
        await transaction.rollback();
        console.error(e);
        throw e;
      }
    } else {
      throw new BadRequestException("File not found");
    }
  }

  async delete(id: number) {
    const candidate = await this.homeCategoryRepository.findOne({where: {id}, raw: true});

    if (!candidate) {
      throw new BadRequestException("Home category with id not found");
    }

    const existingPreviews = await this.previewRepository.findAll({
      where: {imageId: candidate.imageId},
      raw: true
    });
    const transaction = await this.sequelize.transaction();

    try {
      await this.homeCategoryRepository.destroy({where: {id}, transaction});

      if (existingPreviews.length === 0) {
        await this.imageService.deleteImages({imageIds: [candidate.imageId], transaction});
      }

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  async getAll() {
    const homeCategories = await this.homeCategoryRepository.findAll({ raw: true });
    const [images, groups] = await Promise.all([
      this.imageRepository.findAll({
        where: {
          id: { [Op.or]: homeCategories.map(el => el.imageId) }
        },
        raw: true
      }),
      await this.groupRepository.findAll({
        where: {
          id: { [Op.or]: homeCategories.map(el => el.groupId) }
        },
        raw: true
      })
    ]);

    const result: {id: number, image: string, name: string, tagIds: number[]}[] = [];

    for (const el of homeCategories) {
      const image = images.find(i => i.id === el.imageId);
      const group = groups.find(g => g.id === el.groupId);
      const tagsForGroup = await this.tagService.getAllTags(group.id);

      result.push({
        id: el.id,
        image: image.filename,
        name: group.name,
        tagIds: tagsForGroup.map(t => t.id)
      });
    }

    return result;
  }
}
