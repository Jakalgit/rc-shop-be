import { BadRequestException, Injectable } from "@nestjs/common";
import { AllowReadonlyArray, IncrementDecrementOptionsWithBy, Op, Transaction, WhereOptions } from "sequelize";
import { extname } from "path";
import { ImageService } from "../../image/image.service";
import { BaseProductDto } from "../dto/create-product.dto";
import { validate } from "class-validator";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { Product, ProductCreationAttrs } from "../models/product.model";
import { DetailEnum } from "../../enums/detail.enum";
import { TagService } from "../../tags/tag.service";
import { InjectModel } from "@nestjs/sequelize";
import { Detail } from "../models/detail.model";
import { Image } from "../../image/models/image.model";
import { Preview } from "../models/preview.model";

@Injectable()
export class ProductHelpersService {

  constructor(
    private readonly imageService: ImageService,
    private readonly tagService: TagService,
    @InjectModel(Product)
    private readonly productRepository: typeof Product,
    @InjectModel(Detail)
    private readonly detailRepository: typeof Detail,
    @InjectModel(Image)
    private readonly imageRepository: typeof Image,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
  ) {}

  // Создание множества картинок
  async createMultipleImages({
                                       files,
                                       dtoFiles,
                                       transaction,
                                     }: {
    files: Express.Multer.File[];
    dtoFiles: { filename: string; index: number }[];
    transaction: Transaction;
  }) {
    // Проверка расширения
    if (
      files.find(
        (el) => !['.png', '.jpg', '.jpeg'].includes(extname(el.originalname)),
      )
    ) {
      throw new BadRequestException('Допустимые расширения изображений: .png, .jpg, .jpeg');
    }

    // Поверка совпадения массива files и dtoFiles по названию файла
    if (
      (!files.find((file) =>
          dtoFiles.find((el) => el.filename === file.originalname),
        ) &&
        files.length !== 0) ||
      files.length !== dtoFiles.length
    ) {
      throw new BadRequestException('Ошибка обработки файлов, попробуйте заполнить данные заново');
    }

    const concatFiles = files.map((file) => {
      return {
        file,
        index: dtoFiles.find((el) => el.filename === file.originalname).index,
      };
    });

    const promiseImages = concatFiles.map(async (el) => {
      return {
        image: await this.imageService.createImage({
          image: el.file,
          transaction,
        }),
        index: el.index,
      };
    });

    const resultImages = await Promise.all(promiseImages);
    return resultImages.map((el) => {
      return {
        imageId: el.image.id,
        index: el.index,
      };
    });
  }

  // Проверка физических характеристик (длина, ширина и т.д.)
  checkPhysicalCharacteristics(value: number | undefined) {
    if (value && value <= 0) {
      throw new BadRequestException(
        'Значения физических характеристик должны быть больше 0',
      );
    }
  }

  // Проверка ошибок class-validator
  async checkClassValidatorErrors<T extends object>(
    cls: ClassConstructor<T>,
    dto: T,
  ) {
    const instance = plainToInstance(cls, dto);
    const errors = await validate(instance);
    if (errors.length) {
      throw new BadRequestException(errors);
    }
  }

  // Проверка введённой скидки
  checkPromotion(dto: BaseProductDto) {
    if (dto.oldPrice) {
      if (dto.oldPrice <= dto.price) {
        throw new BadRequestException(
          'Цена до скидки не может быть меньше чем или равна цена после',
        );
      }

      if (dto.promotionPercentage) {
        if (dto.promotionPercentage <= 0 || dto.promotionPercentage > 100) {
          throw new BadRequestException(
            'Допустимые значения для размера скидки: от 1 до 100',
          );
        }
      } else {
        dto.promotionPercentage = Math.ceil(
          (1 - dto.price / dto.oldPrice) * 100,
        );
      }
    } else if (dto.promotionPercentage) {
      throw new BadRequestException(
        'Если вы указали скидку в процентах, вы также должны указать цену до скидки'
      );
    }
  }

  async collectDataForProduct(
    {
      options,
      limit,
      page,
      isPartner,
      isAdmin
    }: {
      options?: WhereOptions<Product>;
      limit: number;
      page: number;
      isPartner?: boolean;
      isAdmin?: boolean;
    }
  ) {
    const { price, tagIds, order, ...restOptions } = options as any;

    let productIds: number[] | undefined = undefined;

    // Если теги есть, то ищем связи с продуктами
    if (tagIds && tagIds.length > 0) {
      productIds = await this.tagService.getProductIdsForTagIds(tagIds);
    }

    const where = {
      ...(productIds !== undefined &&
        (productIds.length > 0
          ? { id: { [Op.or]: productIds } }
          : {})),
      ...(restOptions && (Object.keys(restOptions).length > 0 || Object.getOwnPropertySymbols(restOptions).length > 0)
          ? restOptions
          : {}
      ),
      ...(price ? { price } : {}),
      ...(!isAdmin && { visibility: true }),
    }

    // Находим товар
    const products = await this.productRepository.findAndCountAll({
      where,
      attributes: {
        exclude: isPartner ? [] : ['wholesalePrice'],
      },
      limit: limit,
      offset: (page - 1) * limit,
      raw: true,
      order: order || [['createdAt', 'DESC']],
    });

    // Общее количество записей
    const totalRecords = products.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / limit);

    // Полученные записи
    const productRecords = products.rows;

    // Если есть совпадения
    if (productRecords.length !== 0) {
      // Выделяем массив id
      const productIds = productRecords.map((item) => item.id);

      // Если выбираем больше чем 1 продукт, то оставляем для него только превью
      // Иначе выбираем все изображения для продукта
      const filter = {
        productId: {
          [Op.or]: productIds,
        },
        ...(productIds.length > 1 ? {index: 0} : {}),
      };

      // Ищем данные для наших товаров
      const [details, previews, tags] = await Promise.all([
        this.detailRepository.findAll({
          where: filter,
          raw: true,
        }),
        this.previewRepository.findAll({
          where: filter,
          raw: true,
        }),
        this.tagService.getTagsForProducts(productIds),
      ]);

      // Ищем картинки
      const images = await this.imageRepository.findAll({
        where: {
          id: { [Op.or]: previews.map((el) => el.imageId) },
        },
      });

      // Формируем информацию о каждом найденном продукте
      const records = productRecords.map((p) => {
        // Группируем информацию о продуктах
        const groupedDetails = details.reduce(
          (acc, item) => {
            const { productId, createdAt, updatedAt, detailType, ...rest } =
              item;
            const key = detailType.toLowerCase();
            acc[key].push({
              id: rest.id,
              index: rest.index,
              text: rest.text,
            });
            return acc;
          },
          Object.fromEntries(
            Object.values(DetailEnum).map((key) => [key.toLowerCase(), []]),
          ) as Record<string, { id: number; index: number; text: string }[]>,
        );

        // Выбираем превью для данного продукта
        const filteredPreviews = previews.filter(
          (preview) => preview.productId === p.id,
        );
        // Собираем картинки который использует продукт по выбранным превью
        const imageMap = new Map(images.map((img) => [img.id, img.filename]));
        // Группируем картинки для продукта
        const groupedImages = filteredPreviews
          .map((preview) => ({
            index: preview.index,
            filename: imageMap.get(preview.imageId),
            previewId: preview.id,
            imageId: preview.imageId,
          }))
          .sort((a, b) => a.index - b.index);

        // Достаем теги для данного продукта
        const filteredTags = tags
          .filter((tag) => tag.productIds.includes(p.id))
          .map((el) => {
            const { productIds, ...rest } = el;

            return rest;
          });

        return {
          ...p,
          ...groupedDetails,
          images: groupedImages,
          tags: filteredTags,
        };
      });

      return {
        records,
        totalPages,
      };
    } else {
      return {
        records: [],
        totalPages: 1,
      };
    }
  }

  reformatDetails(
    details: { [key: string]: any; detailType: DetailEnum }[],
    detailType: DetailEnum,
  ) {
    return details
      .filter((el) => el.detailType === detailType)
      .map((el, index) => ({
        ...el,
        index,
      }));
  }

  getAttrsForProduct(dto: BaseProductDto) {
    // Атрибуты, необходимые для создания продукта в бд
    const productFields: (keyof ProductCreationAttrs)[] = [
      'name',
      'availability',
      'visibility',
      'price',
      'oldPrice',
      'promotionPercentage',
      'weight',
      'width',
      'height',
      'length',
      'article',
      'count',
      'wholesalePrice',
      'partsUrl',
      'tuningUrl',
      'productGroupId',
    ];

    // Вытаскиваем атрибуты для создания продукта
    const productAttrs = Object.fromEntries(
      productFields.map((key) => [key, dto[key]]),
    );

    // Выделяем только объекты, которые относятся к уже существующим картинкам
    const dtoPreviews = dto.previews.filter(
      (item): item is { imageId: number; index: number } =>
        typeof item.imageId === 'number' && typeof item.index === 'number',
    );

    // Выделяем только объекты, которые относятся к новым картинкам
    const dtoFiles = dto.previews.filter(
      (item): item is { filename: string; index: number } =>
        typeof item.filename === 'string' && typeof item.index === 'number',
    );

    return { productAttrs, dtoPreviews, dtoFiles };
  }

  async checkSomeDtoInformation(dto: BaseProductDto) {
    // Проверка скидки
    this.checkPromotion(dto);

    // Проверка характеристик
    [dto.weight, dto.height, dto.width, dto.length].forEach((el) =>
      this.checkPhysicalCharacteristics(el),
    );

    if (dto.previews.length === 0) {
      throw new BadRequestException(
        'Товар должен содержать хотя бы одну картинку',
      );
    }

    // Проверка картинок для превью
    if (
      dto.previews.find(
        (el) =>
          typeof el.imageId === 'undefined' &&
          typeof el.filename === 'undefined',
      )
    ) {
      throw new BadRequestException('Неверный формат для массива изображений');
    }

    const imagesIds = dto.previews
      .filter((el) => typeof el.imageId !== 'undefined')
      .map((el) => el.imageId);

    if (imagesIds.length > 0) {
      const images = await this.imageRepository.findAll({
        where: {
          id: { [Op.or]: imagesIds },
        },
        raw: true,
      });

      if (images.length !== imagesIds.length) {
        throw new BadRequestException(
          "Как минимум одно изображение с указанными imageId не существует, проверьте массив с imageId",
        );
      }
    }
  }

  assignIndexes(
    details: { text?: string; id?: number; detailType: DetailEnum }[],
  ) {
    const counters: Record<string, number> = {};

    return details.map((item) => {
      const type = item.detailType;

      if (!(type in counters)) {
        counters[type] = 0;
      }

      const indexedItem = { ...item, index: counters[type] };
      counters[type]++;
      return indexedItem;
    });
  }

  async decrementCount(
    fields: AllowReadonlyArray<keyof Product>,
    options: IncrementDecrementOptionsWithBy<Product>,
  ) {
    await this.productRepository.decrement(fields, options);
  }
}