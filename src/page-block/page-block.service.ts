import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { PageBlock } from "./models/page-block.model";
import { UpdatePageBlockDto } from "./dto/create-page-block.dto";
import { PageEnum } from "./enums/page-type.enum";

@Injectable()
export class PageBlockService {

  constructor(
    @InjectModel(PageBlock)
    private readonly pageBlockRepository: typeof PageBlock,
  ) {
  }

  async updateBlocks(dto: UpdatePageBlockDto) {
    this.checkCreatePageBlockDto(dto);

    await this.pageBlockRepository.destroy({
      where: {
        pageType: dto.pageType,
      }
    });

    const pageBlockBulkCreationAttrs = dto.blocks.map(el => {
      return {
        title: el.title,
        description: el.description,
        pageType: dto.pageType,
      }
    });

    await this.pageBlockRepository.bulkCreate(pageBlockBulkCreationAttrs);
  }

  async getPageBlockByPage(pageType: PageEnum) {
    if (!Object.values(PageEnum).includes(pageType)) {
      throw new BadRequestException(`Недопустимое значение для pageType: ${pageType}`);
    }

    return await this.pageBlockRepository.findAll({
      where: {pageType}
    })
  }

  private checkCreatePageBlockDto(dto: UpdatePageBlockDto) {
    const titleLength = {min: 4, max: 100};
    const descriptionLength = {min: 20, max: 1000};

    if (dto.blocks.length === 0) {
      throw new BadRequestException("Нужен как минимум 1 блок на странице");
    }

    dto.blocks.forEach(block => {
      if (block.title.length < titleLength.min || block.title.length > titleLength.max) {
        throw new BadRequestException(
          `Длина заголовка должна быть не меньше ${titleLength.min} и не больше ${titleLength.max} символов`
        );
      }

      if (block.description.length < descriptionLength.min || block.description.length > descriptionLength.max) {
        throw new BadRequestException(
          `Длина описания должна быть не меньше ${descriptionLength.min} и не больше ${descriptionLength.max} символов`
        );
      }
    });
  }
}
