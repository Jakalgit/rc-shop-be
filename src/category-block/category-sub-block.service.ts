import { Injectable } from "@nestjs/common";
import { SubBlockDto } from "./dto/update-category-block.dto";
import { Op, Transaction } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { CategorySubBlock } from "./models/category-subblock.model";
import { ImageService } from "../image/image.service";
import { CategoryBlockSharedService } from "./category-block-shared.service";

@Injectable()
export class CategorySubBlockService {

  constructor(
    @InjectModel(CategorySubBlock)
    private readonly categorySubBlockRepository: typeof CategorySubBlock,
    private readonly imageService: ImageService,
    private readonly categoryBlockSharedService: CategoryBlockSharedService,
  ) {}

  async updateSubBlocks(blocks: SubBlockDto[], files: Express.Multer.File[], transaction: Transaction) {
    // Проверяем данные

    // Удаляем все блоки, которых нет в dto, но есть в бд
    await this.deleteSubBlocks(blocks, transaction);

    // Обновляем блоки в бд
    await this.updateExistSubBlock(blocks, files, transaction);

    // Выделяем только те блоки которые привязаны к уже существующему блоку
    blocks = blocks.filter(el => el.categoryBlockId > 0);
    // Создаем новые блоки
    await this.createNewSubBlock(blocks, files, transaction);
  }

  async checkDtoBlocksData() {

  }

  private async deleteSubBlocks(blocks: SubBlockDto[], transaction: Transaction) {
    // Находим все блоки
    const allBlocks = await this.categorySubBlockRepository.findAll({raw: true});
    // Находим блоки из бд которых нет в dto
    const blocksToDelete = allBlocks.filter(el => !blocks.find(n => n.id === el.id));
    // Выделяем картинки блоков для удаления
    const imageIdsToDelete = blocksToDelete.map(el => el.imageId);

    if (blocksToDelete.length > 0) {
      // Удаляем блоки
      await this.categorySubBlockRepository.destroy({
        where: {
          id: { [Op.or]: blocksToDelete.map(el => el.id) }
        },
        transaction
      });
    }

    if (imageIdsToDelete.length > 0) {
      // Удаляем картинки
      await this.imageService.deleteImages({imageIds: imageIdsToDelete, transaction});
    }
  }

  private async updateExistSubBlock(blocks: SubBlockDto[], files: Express.Multer.File[], transaction: Transaction) {
    // Находим блоки в базе данных
    const blocksInDb = await this.categorySubBlockRepository.findAll({
      where: { id: { [Op.or]: blocks.map(el => el.id) } },
      raw: true,
    });
    const fieldsToCompare = ["blockLink", "index", "categoryBlockId", "name"];
    // Под-блоки которые реально отличаются данными, их нужно обновить
    const blocksToUpdate = blocksInDb.map(blockDb => {
      const blockDto = blocks.find(el => el.id === blockDb.id);
      return this.categoryBlockSharedService.determineBlockWithImageToUpdate<typeof blockDto, typeof blockDb>(
        blockDto,
        blockDb,
        fieldsToCompare,
        files
      );
    }).filter(el => el.needUpdate);

    const asyncActions: Promise<any>[] = [];

    for (const block of blocksToUpdate) {
      // Создаем объект с новыми значениями полей
      let fieldsToUpdate: Partial<Pick<CategorySubBlock, "index" | "blockLink" | "imageId" | "categoryBlockId" | "name">> = {
        index: block.blockDto.index,
        blockLink: block.blockDto.blockLink,
        categoryBlockId: block.blockDto.categoryBlockId,
        name: block.blockDto.name,
      };

      // Если нам нужно просто заменить одно imageId на другое, сработает если изначально imageId
      // в dto и в базе данных отличаются
      // TODO: Вынести дубликат кода в функцию и оптимизировать работу с картинками
      if (block.imageAction === "replace") {
        fieldsToUpdate = {...fieldsToUpdate, imageId: block.blockDto.preview.imageId}
      } else if (block.imageAction === "create") {
        asyncActions.push(
          // Удаляем старое
          this.imageService.deleteImages({
            imageIds: [block.blockDb.imageId],
            transaction
          })
        );
        // Создаем новое
        const resultImage = await this.imageService.createImage({
          image: block.newImageFile,
          transaction,
        });
        fieldsToUpdate = {...fieldsToUpdate, imageId: resultImage.id}
      }

      asyncActions.push(
        this.categorySubBlockRepository.update(
          fieldsToUpdate,
          { where: {id: block.id}, transaction }
        )
      )
    }
    // Обновляем существующие блоки
    await Promise.all(asyncActions);
  }

  async createNewSubBlock(blocks: SubBlockDto[], files: Express.Multer.File[], transaction: Transaction) {
    // Добавляем новые блоки
    const blockToAdd = blocks.filter(el => el.id < 0);
    if (blockToAdd.length === 0) {
      return;
    }

    // TODO: Оптимизировать создание картинок
    // Данные для создания под-блоков
    const subBlocksBulkCreate = await Promise.all(blockToAdd.map(async el => {
      let imageId = el.preview.imageId;
      if (typeof imageId === "undefined") {
        const imageFile = files.find(f => f.originalname === el.preview.filename);
        imageId = (await this.imageService.createImage({image: imageFile, transaction})).id;
      }
      return {
        blockLink: el.blockLink,
        name: el.name,
        index: el.index,
        categoryBlockId: el.categoryBlockId,
        imageId,
      }
    }));

    // Создаем новые блоки
    await this.categorySubBlockRepository.bulkCreate(subBlocksBulkCreate, {transaction});
  }

}