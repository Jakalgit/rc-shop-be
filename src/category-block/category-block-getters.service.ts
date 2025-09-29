import { Injectable } from "@nestjs/common";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { CategoryBlock } from "./models/category-block.model";
import { CategorySubBlock } from "./models/category-subblock.model";
import { CategoryLink } from "./models/category-link.model";
import { ImageService } from "../image/image.service";

@Injectable()
export class CategoryBlockGettersService {

  constructor(
    @InjectModel(CategoryBlock)
    private readonly categoryBlockRepository: typeof CategoryBlock,
    @InjectModel(CategorySubBlock)
    private readonly categorySubBlockRepository: typeof CategorySubBlock,
    @InjectModel(CategoryLink)
    private readonly categoryLinkRepository: typeof CategoryLink,
    private readonly imageService: ImageService,
  ) {
  }

  async getCategoryBlocksAdm() {
    const {categoryBlocks, categoryLinks, categorySubBlocks, images} = await this.getDataFromDb();

    const links = categoryLinks.map((link) => ({
      id: link.id,
      link: link.link,
      linkText: link.linkText,
      index: link.index,
      categoryBlockId: link.categoryBlockId,
    }));

    const subBlocks = categorySubBlocks.map((subBlock) => ({
      id: subBlock.id,
      blockLink: subBlock.blockLink,
      name: subBlock.name,
      index: subBlock.index,
      preview: {
        filename: images.find((image) => image.id === subBlock.imageId)
          .filename,
        imageId: subBlock.imageId,
      },
      categoryBlockId: subBlock.categoryBlockId,
    }));

    const blocks = categoryBlocks.map((block) => ({
      id: block.id,
      blockText: block.blockText,
      index: block.index,
      preview: {
        filename: images.find((image) => image.id === block.imageId).filename,
        imageId: block.imageId,
      },
    }));

    return {
      blocks,
      links,
      subBlocks,
    };
  }

  async getCategoryBlocksUsr() {
    const {categoryBlocks, categoryLinks, categorySubBlocks, images} = await this.getDataFromDb();

    return categoryBlocks.map(block => {
      const links = categoryLinks.filter(el => el.categoryBlockId === block.id).map(el => ({
        link: el.link,
        linkText: el.linkText,
        index: el.index,
      }));

      const subBlocks = categorySubBlocks.filter(el => el.categoryBlockId === block.id).map(el => ({
        blockLink: el.blockLink,
        name: el.name,
        index: el.index,
        image: images.find(img => img.id === el.imageId).filename,
      }));

      return {
        blockText: block.blockText,
        index: block.index,
        image: images.find(img => img.id === block.imageId).filename,
        links,
        subBlocks,
      }
    })
  }

  private async getDataFromDb() {
    const [categoryBlocks, categoryLinks, categorySubBlocks] = await Promise.all([
      this.categoryBlockRepository.findAll({
        raw: true,
      }),
      this.categoryLinkRepository.findAll({
        raw: true,
      }),
      this.categorySubBlockRepository.findAll({
        raw: true,
      })
    ]);

    const imageIds = [
      ...categoryBlocks.map((el) => el.imageId),
      ...categorySubBlocks.map((el) => el.imageId),
    ];
    const images = await this.imageService.findImages({
      where: { id: { [Op.or]: imageIds } },
      raw: true,
    });

    return {
      categoryBlocks,
      categoryLinks,
      categorySubBlocks,
      images,
    }
  }
}