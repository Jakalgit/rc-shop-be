import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { SliderItem } from "./models/slider-item";
import { UpdateSliderDto } from "./dto/update-slider.dto";
import { Op, Transaction } from "sequelize";
import { ImageService } from "../image/image.service";
import { Sequelize } from "sequelize-typescript";
import { ExistingSlide, NewSlide } from "./types/dto-slides.type";

@Injectable()
export class PromotionSliderService {

  constructor(
    @InjectModel(SliderItem)
    private readonly sliderItemRepository: typeof SliderItem,
    private readonly imageService: ImageService,
    private readonly sequelize: Sequelize,
  ) {
  }

  // Метод для обновления слайдов в базе данных
  async update(dto: UpdateSliderDto, files: Express.Multer.File[]) {
    // Присваиваем каждому элементу в DTO индекс на основе его положения в массиве
    const indexedItems = dto.items.map((el, i) => ({
      ...el,
      index: i
    }));

    // Фильтруем элементы, чтобы выделить новые слайды (содержат поле filename)
    const newSlides = indexedItems.filter(el => 'filename' in el && typeof el.filename === 'string') as (NewSlide & { index: number })[];

    // Фильтруем элементы, чтобы выделить существующие слайды (содержат поле id)
    const existingSlides = indexedItems.filter(el => 'id' in el && typeof el.id === 'number') as (ExistingSlide & { index: number })[];

    // Создаём транзакцию для обеспечения атомарности операций с базой данных
    const transaction = await this.sequelize.transaction();

    // Массив ID слайдов, которые не нужно удалять (новые и обновлённые слайды)
    let excludeIdsToDelete: number[] = [];

    try {
      // Обработка новых слайдов
      if (newSlides.length > 0) {
        // Проверяем, что количество новых слайдов совпадает с количеством загруженных файлов
        if (newSlides.length !== files.length) {
          throw new BadRequestException("Количество новых слайдов не совпадает с количеством загруженных файлов изображений");
        }

        // Проверяем, что все filenames из newSlides соответствуют файлам в массиве files
        if (!newSlides.every(el => files.some(f => f.originalname === el.filename))) {
          throw new BadRequestException("One of the files specified in the new slides array is missing from the file array in the request body.");
        }

        // Создаём записи изображений в базе данных и загружаем файлы в S3
        const images = await this.imageService.createImages({ images: files, transaction });

        // Формируем массив для массового создания слайдов, связывая их с изображениями
        const slidesBulkCreate = newSlides.map(el => {
          const img = images.find(i => i.original === el.filename);
          return {
            href: el.href,
            imageId: img.id, // ID изображения из базы данных
            index: el.index,
            title: el.title,
            text: el.text,
            buttonText: el.buttonText,
          };
        });

        // Массово создаём слайды в базе данных
        const slides = await this.sliderItemRepository.bulkCreate(slidesBulkCreate, { transaction });

        // Добавляем ID новых слайдов в список исключений для удаления
        excludeIdsToDelete = [...excludeIdsToDelete, ...slides.map(el => el.dataValues.id)];
      }

      // Обработка существующих слайдов
      if (existingSlides.length > 0) {
        // Получаем существующие слайды из базы данных по их ID
        const dbSlides = await this.sliderItemRepository.findAll({
          where: {
            id: { [Op.or]: existingSlides.map(el => el.id) }
          },
          raw: true, // Получаем данные в виде простых объектов
        });

        // Проверяем уникальность ID в массиве existingSlides
        const existingIds = existingSlides.map(el => el.id);
        const uniqueExistingIds = new Set(existingIds);
        if (uniqueExistingIds.size !== existingSlides.length) {
          throw new BadRequestException("Ошибка, массив существующих слайдов содержит элементы с одинаковыми id");
        }

        // Проверяем, что все указанные ID существуют в базе данных
        if (dbSlides.length !== uniqueExistingIds.size) {
          throw new BadRequestException("Ошибка, как минимум 1 слайд с id из запроса не существует в бд");
        }

        // Формируем список промисов для обновления слайдов
        const promises: Promise<any>[] = [];

        // Определяем, какие слайды нужно обновить (если href или index изменились)
        const slidesToUpdate = existingSlides.map(el => {
          const dbSlide = dbSlides.find(s => s.id === el.id);
          if (dbSlide.index !== el.index || dbSlide.href !== el.href) {
            return {
              id: dbSlide.id,
              href: el.href,
              index: el.index,
            };
          }
        }).filter(Boolean); // Убираем undefined (слайды, которые не нужно обновлять)

        // Создаём промисы для обновления изменённых слайдов
        for (const slide of slidesToUpdate) {
          promises.push(this.sliderItemRepository.update(
            { href: slide.href, index: slide.index },
            { where: { id: slide.id }, transaction }
          ));
        }

        // Выполняем все обновления параллельно
        await Promise.all(promises);

        // Добавляем ID существующих слайдов в список исключений для удаления
        excludeIdsToDelete = [...excludeIdsToDelete, ...existingIds];

        // Удаляем все слайды, не входящие в excludeIdsToDelete
        await this.deleteSlides(excludeIdsToDelete, transaction);
      }

      // Коммитим транзакцию, если все операции успешны
      await transaction.commit();
    } catch (e) {
      // В случае ошибки откатываем транзакцию
      await transaction.rollback();
      // Логируем ошибку для отладки
      console.error(e);
      // Пробрасываем ошибку дальше
      throw e;
    }
  }

  async getSliders() {
    const slides = await this.sliderItemRepository.findAll({
      raw: true,
      order: [['index', 'ASC']],
      attributes: { exclude: ['index'] },
    });

    const images = await this.imageService.findImages({
      where: {
        id: { [Op.or]: slides.map(el => el.imageId ) },
      },
      raw: true,
    });

    return slides.map(slide => {
      const image = images.find(el => el.id === slide.imageId);

      return {
        id: slide.id,
        filename: image.filename,
        href: slide.href,
        imageId: slide.imageId,
        text: slide.text,
        buttonText: slide.buttonText,
        title: slide.title,
      }
    })
  }

  private async deleteSlides(excludeIds: number[], transaction?: Transaction) {
    const slidesToDelete = await this.sliderItemRepository.findAll({
      where: {id: { [Op.notIn]: excludeIds } },
      raw: true,
    });

    const imageIdsToDelete = slidesToDelete.map(el => el.imageId);

    if (imageIdsToDelete.length > 0) {
      await this.sliderItemRepository.destroy({
        where: {
          id: {
            [Op.or]: slidesToDelete.map(el => el.id),
          }
        },
        transaction,
      });
      await this.imageService.deleteImages({imageIds: imageIdsToDelete, transaction});
    }
  }
}
