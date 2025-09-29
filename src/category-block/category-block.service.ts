import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CategoryBlock } from './models/category-block.model';
import { CategoryLink } from './models/category-link.model';
import { CategorySubBlock } from './models/category-subblock.model';
import {
  CategoryBlockDto,
  LinkBlockDto,
  SubBlockDto,
  UpdateCategoryBlockDto,
} from './dto/update-category-block.dto';
import { Sequelize } from 'sequelize-typescript';
import { CategorySubBlockService } from './category-sub-block.service';
import { Op, Transaction } from 'sequelize';
import { ImageService } from '../image/image.service';
import { CategoryBlockSharedService } from './category-block-shared.service';
import { CategoryBlockLinkService } from './category-block-link.service';
import ISOLATION_LEVELS = Transaction.ISOLATION_LEVELS;

@Injectable()
export class CategoryBlockService {
  constructor(
    @InjectModel(CategoryBlock)
    private readonly categoryBlockRepository: typeof CategoryBlock,
    @InjectModel(CategorySubBlock)
    private readonly categorySubBlockRepository: typeof CategorySubBlock,
    @InjectModel(CategoryLink)
    private readonly categoryLinkRepository: typeof CategoryLink,
    private readonly sequelize: Sequelize,
    private readonly categorySubBlockService: CategorySubBlockService,
    private readonly categoryBlockLinkService: CategoryBlockLinkService,
    private readonly categoryBlockSharedService: CategoryBlockSharedService,
    private readonly imageService: ImageService,
  ) {}

  async updateCategoryBlocks(
    dto: UpdateCategoryBlockDto,
    files: Express.Multer.File[],
  ) {
    // Запускаем транзакцию
    const transaction = await this.sequelize.transaction({
      isolationLevel: ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // Обновляем блоки
      await this.updateBlocks(dto, files, transaction);

      // Обновляем под-блоки
      await this.categorySubBlockService.updateSubBlocks(
        dto.subBlocks,
        files,
        transaction,
      );

      // Обновляем существующие ссылки в блоках
      await this.categoryBlockLinkService.updateLinks(dto.links, transaction);

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  private async updateBlocks(
    dto: UpdateCategoryBlockDto,
    files: Express.Multer.File[],
    transaction: Transaction,
  ) {
    // Проверяем данные

    // Удаляем блоки которых нет в dto
    await this.deleteBlocks(dto.blocks, transaction);

    // Обновляем существующие блоки
    await this.updateExistBlocks(dto.blocks, files, transaction);

    // Создаем новые блоки
    await this.createNewBlocks(
      dto.blocks,
      dto.links,
      dto.subBlocks,
      files,
      transaction,
    );
  }

  private async checkDtoBlocksData() {}

  private async deleteBlocks(
    blocks: CategoryBlockDto[],
    transaction: Transaction,
  ) {
    // Получаем все существующие блоки
    const allBlocks = await this.categoryBlockRepository.findAll({ raw: true });
    // Находим блоки, которых нет в обновлённых данных - их надо удалить
    const blocksToDelete = allBlocks.filter(
      (el) => !blocks.find((n) => n.id === el.id),
    );
    // Картинки, которые подлежат удалению (как обычных блоков, так и под-блоков)
    const imagesToDelete = blocksToDelete.map((el) => el.imageId);
    // Получаем массив id переданных блоков
    const categoryBlockIds = blocksToDelete.map((el) => el.id);
    // Находим под-блоки для наших блоков
    const subBlocks =
      categoryBlockIds.length > 0
        ? await this.categorySubBlockRepository.findAll({
            where: { categoryBlockId: { [Op.or]: categoryBlockIds } },
            raw: true,
          })
        : [];
    // Дополняем массив картинок к удалению картинками под-блоков
    imagesToDelete.push(...subBlocks.map((el) => el.imageId));
    const promises: Promise<any>[] = [];

    if (categoryBlockIds.length > 0) {
      promises.push(
        // Удаляем блоки
        this.categoryBlockRepository.destroy({
          where: { id: { [Op.or]: categoryBlockIds } },
          transaction,
        }),
      );
    }

    if (imagesToDelete.length > 0) {
      promises.push(
        // Удаляем картинки
        this.imageService.deleteImages({
          imageIds: imagesToDelete,
          transaction,
        }),
      );
    }
    await Promise.all(promises);
  }

  private async updateExistBlocks(
    blocks: CategoryBlockDto[],
    files: Express.Multer.File[],
    transaction: Transaction,
  ) {
    // Находим блоки в базе данных
    const blocksIdDb = await this.categoryBlockRepository.findAll({
      where: { id: { [Op.or]: blocks.map((el) => el.id) } },
      raw: true,
      transaction,
    });
    const fieldsToCompare = ['blockText', 'index'];
    // Блоки которые реально отличаются данными, их нужно обновить
    const blocksToUpdate = blocksIdDb
      .map((blockDb) => {
        const blockDto = blocks.find((el) => el.id === blockDb.id);
        return this.categoryBlockSharedService.determineBlockWithImageToUpdate<
          typeof blockDto,
          typeof blockDb
        >(blockDto, blockDb, fieldsToCompare, files);
      })
      .filter((el) => el.needUpdate);

    const asyncActions: Promise<any>[] = [];

    for (const block of blocksToUpdate) {
      // Создаем объект с новыми значениями полей
      let fieldsToUpdate: Partial<
        Pick<CategoryBlock, 'index' | 'blockText' | 'imageId'>
      > = { index: block.blockDto.index, blockText: block.blockDto.blockText };

      // Если нам нужно просто заменить одно imageId на другое, сработает если изначально imageId
      // в dto и в базе данных отличаются
      if (block.imageAction === 'replace') {
        fieldsToUpdate = {
          ...fieldsToUpdate,
          imageId: block.blockDto.preview.imageId,
        };
      } else if (block.imageAction === 'create') {
        // Если нужно создать новое изображение
        asyncActions.push(
          // Удаляем старое
          this.imageService.deleteImages({
            imageIds: [block.blockDb.imageId],
            transaction,
          }),
        );
        // Создаем новое
        const resultImage = await this.imageService.createImage({
          image: block.newImageFile,
          transaction,
        });
        fieldsToUpdate = { ...fieldsToUpdate, imageId: resultImage.id };
      }

      asyncActions.push(
        this.categoryBlockRepository.update(fieldsToUpdate, {
          where: { id: block.id },
          transaction,
        }),
      );
    }
    // Обновляем блоки
    await Promise.all(asyncActions);
  }

  private async createNewBlocks(
    blocks: CategoryBlockDto[],
    links: LinkBlockDto[],
    subBlocks: SubBlockDto[],
    files: Express.Multer.File[],
    transaction: Transaction,
  ) {
    // Выделяем новые блоки
    const blockToAdd = blocks.filter((el) => el.id < 0);
    if (blockToAdd.length === 0) {
      return;
    }

    for (const newBlock of blockToAdd) {
      let newLinks = links.filter((el) => el.categoryBlockId === newBlock.id);
      let newSubBlocks = subBlocks.filter(
        (el) => el.categoryBlockId === newBlock.id,
      );

      let imageId = newBlock.preview.imageId;
      if (typeof imageId === 'undefined') {
        const imageFile = files.find(
          (f) => f.originalname === newBlock.preview.filename,
        );
        imageId = (
          await this.imageService.createImage({ image: imageFile, transaction })
        ).id;
      }
      const data = {
        blockText: newBlock.blockText,
        index: newBlock.index,
        imageId,
      };
      const blockDb = await this.categoryBlockRepository.create(data, {
        transaction,
      });

      newLinks = newLinks.map((el) => ({
        ...el,
        categoryBlockId: blockDb.dataValues.id,
      }));
      newSubBlocks = newSubBlocks.map((el) => ({
        ...el,
        categoryBlockId: blockDb.dataValues.id,
      }));

      await this.categorySubBlockService.createNewSubBlock(
        newSubBlocks,
        files,
        transaction,
      );
      await this.categoryBlockLinkService.createNewLinks(newLinks, transaction);

      // await Promise.all([
      //   this.categorySubBlockService.createNewSubBlock(newSubBlocks, files, transaction),
      //   this.categoryBlockLinkService.createNewLinks(newLinks, transaction),
      // ]);
    }
  }
}
