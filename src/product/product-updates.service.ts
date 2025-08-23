import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateProductDto } from "./dto/update-product.dto";
import { Op, Transaction } from "sequelize";
import { ProductHelpersService } from "./product-helpers.service";
import { InjectModel } from "@nestjs/sequelize";
import { Detail } from "./models/detail.model";
import { Preview } from "./models/preview.model";
import { ImageService } from "../image/image.service";
import { TagService } from "../tags/tag.service";

@Injectable()
export class ProductUpdatesService {

  constructor(
    private readonly productHelpersService: ProductHelpersService,
    private readonly imageService: ImageService,
    private readonly tagService: TagService,
    @InjectModel(Detail)
    private readonly detailRepository: typeof Detail,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
  ) {
  }

  async updateDetails({
                                dto,
                                productId,
                                transaction = null,
                              }: {
    productId: number;
    dto: UpdateProductDto;
    transaction?: Transaction;
  }) {
    // Добавляем индексы к описаниям, чтобы учесть порядок в котором они будут отображаться
    const detailsWithIndexes = this.productHelpersService.assignIndexes(dto.details);

    // Получаем все описания для данного продукта
    const fullDetails = await this.detailRepository.findAll({
      where: { productId },
    });
    // Находим те описания, которые есть в бд, но нет в dto обновления
    const detailsToDelete = fullDetails.filter(
      (d) => !dto.details.find((el) => el.id === d.dataValues.id),
    );
    // Удаляем из бд все описания, которых нет в dto
    if (detailsToDelete.length > 0) {
      await this.detailRepository.destroy({
        where: {
          id: { [Op.or]: detailsToDelete.map((el) => el.dataValues.id) },
        },
        transaction,
      });
    }

    // Выделяем все описания которые уже существуют в бд
    const detailsToUpdate = detailsWithIndexes.filter(
      (el) => typeof el.id === 'number',
    );
    // Создаем массив промисов обновления описаний
    const detailsUpdatePromises = detailsToUpdate.map((dt) => {
      // Находим описание в бд, соответствующее текущему
      const dbDetail = fullDetails.find((el) => el.dataValues.id === dt.id);
      if (!dbDetail) {
        throw new BadRequestException("Одно из описаний в запросе не существует в бд");
      }

      if (
        dbDetail.dataValues.index !== dt.index ||
        dbDetail.dataValues.text !== dt.text
      ) {
        return dbDetail.update(
          {
            index: dt.index,
            text: dt.text,
          },
          { transaction },
        );
      }
    });

    // Ожидаем обновления
    await Promise.all(detailsUpdatePromises);
  }

  async updatePreviews(
    {
      dtoFiles,
      files,
      dtoPreviews,
      productId,
      transaction,
    }: {
      dtoFiles: { filename: string; index: number }[];
      dtoPreviews: { imageId: number; index: number }[];
      productId: number;
      transaction?: Transaction;
      files: Express.Multer.File[];
    }
  ) {
    // Получаем все превью продукта
    const fullPreviews = await this.previewRepository.findAll({
      where: { productId },
      raw: true,
    });
    // Находим те превью, которые есть в бд, но нет в dto обновления
    const previewsToDelete = fullPreviews.filter(
      (p) => !dtoPreviews.find((el) => el.imageId === p.imageId),
    );

    // Находим превью с изображениями к удалению, которые не относятся к текущему продукту,
    // чтобы понять что удалять, а что нет
    const otherPreviewsWithSuchImages = await this.previewRepository.findAll({
      where: {
        productId: { [Op.ne]: productId },
        imageId: { [Op.or]: previewsToDelete.map((el) => el.imageId) },
      },
      raw: true,
    });
    // Фильтруем картинки, получаем только те, которые используются как превью для только этого продукта
    const imagesIdsToDelete = previewsToDelete
      .filter(
        (p) =>
          !otherPreviewsWithSuchImages.find((el) => el.imageId === p.imageId),
      )
      .map((el) => el.imageId);

    const [_, createdImages] = await Promise.all([
      // Удаляем картинки, за ними автоматом подтянутся превью
      this.imageService.deleteImages({
        imageIds: imagesIdsToDelete,
        transaction,
      }),
      // Загружаем файлы и создаем новые картинки
      this.productHelpersService.createMultipleImages({ files, dtoFiles, transaction }),
    ]);

    // Находим те изображения, которые существуют в бд и не установлены как превью, но есть в dto
    const imagesToAdd = dtoPreviews.filter(
      (p) => !fullPreviews.find((el) => el.imageId === p.imageId),
    );
    // Находим те превью, которые надо обновить
    const previewsToUpdate = dtoPreviews.filter((p) =>
      fullPreviews.find(
        (el) => el.imageId === p.imageId && el.index !== p.index,
      ),
    );

    const updatePreviewsPromises = previewsToUpdate.map((el) =>
      this.previewRepository.update(
        { index: el.index },
        {
          where: { imageId: el.imageId, productId },
          transaction,
        },
      ),
    );

    await Promise.all(updatePreviewsPromises);

    // Данные для создания превью
    const previewBulkCreateData = [...imagesToAdd, ...createdImages].map(
      (el) => {
        return { imageId: el.imageId, productId, index: el.index };
      },
    );

    // Создаем превью
    await this.previewRepository.bulkCreate(previewBulkCreateData, {
      transaction,
    });
  }

  async updateTags({
                             tagIds,
                             productId,
                             transaction,
                           }: {
    tagIds: number[];
    productId: number;
    transaction?: Transaction;
  }) {
    return await this.tagService.connectTagsToProduct({
      tagIds,
      productId,
      transaction,
    });
  }
}