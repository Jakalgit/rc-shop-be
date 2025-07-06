import { BadRequestException, Injectable } from "@nestjs/common";
import { Product, ProductCreationAttrs } from "./models/product.model";
import { InjectModel } from '@nestjs/sequelize';
import { Preview } from './models/preview.model';
import { Detail } from './models/detail.model';
import { BaseProductDto, CreateProductDto } from "./dto/create-product.dto";
import { Op, Transaction, WhereOptions } from "sequelize";
import { DetailEnum } from '../enums/detail.enum';
import { Sequelize } from "sequelize-typescript";
import { Image } from "../image/models/image.model";
import { ImageService } from "../image/image.service";
import { extname } from "path";
import { TagService } from "../tags/tag.service";
import { ClassConstructor, plainToInstance } from "class-transformer";
import { validate } from 'class-validator';
import { GetProductDto } from "./dto/get-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private readonly productRepository: typeof Product,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
    @InjectModel(Detail)
    private readonly detailRepository: typeof Detail,
    @InjectModel(Image)
    private readonly imageRepository: typeof Image,
    private readonly imageService: ImageService,
    private readonly tagService: TagService,
    private readonly sequelize: Sequelize,
  ) {}

  // Создание множества картинок
  private async createMultipleImages(
    { files, dtoFiles, transaction }:
    {
      files: Express.Multer.File[],
      dtoFiles: {filename: string, index: number}[],
      transaction: Transaction,
    }
  ) {
    // Проверка расширения
    if (files.find(el => !['.png', '.jpg', '.jpeg'].includes(extname(el.originalname)))) {
      throw new BadRequestException("Allowed extensions: .png, .jpg, .jpeg");
    }

    // Поверка совпадения массива files и dtoFiles по названию файла
    if (
      (
        !files.find(file => dtoFiles.find(el => el.filename === file.originalname)) &&
        files.length !== 0
      ) ||
      files.length !== dtoFiles.length
    ) {
      throw new BadRequestException("Error files");
    }

    const concatFiles = files.map(file => {
      return {
        file,
        index: dtoFiles.find(el => el.filename === file.originalname).index,
      }
    });

    const promiseImages = concatFiles.map(async el => {
      return {
        image: await this.imageService.createImage({image: el.file, transaction}),
        index: el.index,
      }
    });

    const resultImages = await Promise.all(promiseImages);
    return resultImages.map(el => {
      return {
        imageId: el.image.id,
        index: el.index,
      }
    });
  }

  // Проверка физических характеристик (длина, ширина и т.д.)
  private checkPhysicalCharacteristics(value: number | undefined) {
    if (value && value <= 0) {
      throw new BadRequestException(
        'Physical characteristics must be greater than 0',
      );
    }
  }

  // Проверка ошибок class-validator
  private async checkClassValidatorErrors<T extends object>(cls: ClassConstructor<T>, dto: T) {
    const instance = plainToInstance(cls, dto);
    const errors = await validate(instance);
    if (errors.length) {
      throw new BadRequestException(errors);
    }
  }

  // Проверка введённой скидки
  private checkPromotion(dto: BaseProductDto) {
    if (dto.oldPrice) {
      if (dto.oldPrice <= dto.price) {
        throw new BadRequestException(
          'The price before the discount cannot be less than the current one',
        );
      }

      if (dto.promotionPercentage) {
        if (dto.promotionPercentage <= 0 || dto.promotionPercentage > 100) {
          throw new BadRequestException(
            'Acceptable values for the discount number: from 1 to 100',
          );
        }
      } else {
        dto.promotionPercentage = Math.ceil(
          (1 - dto.price / dto.oldPrice) * 100,
        );
      }
    } else if (dto.promotionPercentage) {
      throw new BadRequestException(
        'If you have indicated the discount amount as a percentage, then you must also indicate the old price',
      );
    }
  }

  private async collectDataForProduct(
    {options, limit, page}:
    {options?: WhereOptions<Product>, limit: number, page: number}
  ) {
    const { price, tagIds, ...restOptions } = options as any;

    let productIds: number[] | undefined = undefined;

    // Если теги есть, то ищем связи с продуктами
    if (tagIds && tagIds.length > 0) {
      productIds = await this.tagService.getProductIdsForTagIds(tagIds);
    }

    // Находим товар
    const products = await this.productRepository.findAndCountAll({
      where: {
        ...(productIds !== undefined && (productIds.length > 0 ? {id: {[Op.or]: productIds}} : {id: null})),
        ...(Object.keys(restOptions).length !== 0 ? {[Op.or]: restOptions} : {}),
        ...(price ? {price} : {}),
        visibility: true
      },
      limit: limit,
      offset: (page - 1) * limit,
      raw: true,
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
      const productIds = productRecords.map(item => item.id);

      const filter = {
        productId: {
          [Op.or]: productIds,
        }
      }

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
          id: { [Op.or]: previews.map(el => el.imageId) },
        }
      });

      // Формируем информацию о каждом найденном продукте
      const records = productRecords.map(p => {
        // Группируем информацию о продуктах
        const groupedDetails = details.reduce((acc, item) => {
          const { productId, createdAt, updatedAt, detailType, ...rest } = item;
          const key = detailType.toLowerCase();
          acc[key].push({
            id: rest.id,
            index: rest.index,
            text: rest.text,
          });
          return acc;
        }, Object.fromEntries(
          Object.values(DetailEnum).map((key) => [key.toLowerCase(), []])
        ) as Record<string, { id: number; index: number; text: string }[]>);

        // Выбираем превью для данного продукта
        const filteredPreviews = previews.filter(preview => preview.productId === p.id);
        // Собираем картинки который использует продукт по выбранным превью
        const imageMap = new Map(images.map(img => [img.id, img.filename]));
        // Группируем картинки для продукта
        const groupedImages = filteredPreviews
          .map(preview => ({
            index: preview.index,
            filename: imageMap.get(preview.imageId),
            previewId: preview.id,
            imageId: preview.imageId
          }))
          .sort((a, b) => a.index - b.index);

        // Достаем теги для данного продукта
        const filteredTags = tags
          .filter(tag => tag.productId === p.id)
          .map(el => {
            const { productId, ...rest } = el;

            return rest;
          })

        return {
          ...p,
          ...groupedDetails,
          images: groupedImages,
          tags: filteredTags
        }
      });

      return {
        records,
        totalPages,
      }
    } else {
      return {
        records: [],
        totalPages: [],
      }
    }
  }

  private reformatDetails(details: {[key: string]: any, detailType: DetailEnum}[], detailType: DetailEnum) {
    return details
      .filter((el) => el.detailType === detailType)
      .map((el, index) => ({
        ...el,
        index,
      }));
  }

  private getAttrsForProduct(dto: BaseProductDto) {
    // Атрибуты, необходимые для создания продукта в бд
    const productFields: (keyof ProductCreationAttrs)[] = [
      'name', 'availability', 'visibility', 'price',
      'oldPrice', 'promotionPercentage', 'weight',
      'width', 'height', 'length', 'article', 'count'
    ];

    // Вытаскиваем атрибуты для создания продукта
    const productAttrs = Object.fromEntries(
      productFields.map((key) => [key, dto[key]])
    );

    // Выделяем только объекты, которые относятся к уже существующим картинкам
    const dtoPreviews = dto.previews
      .filter(
        (item): item is { imageId: number; index: number } =>
          typeof item.imageId === 'number' && typeof item.index === 'number'
      );

    // Выделяем только объекты, которые относятся к новым картинкам
    const dtoFiles = dto.previews
      .filter(
        (item): item is { filename: string; index: number } =>
          typeof item.filename === 'string' && typeof item.index === 'number'
      );


    return {productAttrs, dtoPreviews, dtoFiles}
  }

  private async checkSomeDtoInformation(dto: BaseProductDto) {
    // Проверка скидки
    this.checkPromotion(dto);

    // Проверка характеристик
    [dto.weight, dto.height, dto.width, dto.length].forEach((el) =>
      this.checkPhysicalCharacteristics(el),
    );

    if (dto.previews.length === 0) {
      throw new BadRequestException("Product must be have at least one preview");
    }

    // Проверка картинок для превью
    if (dto.previews.find(el =>
      typeof el.imageId === 'undefined' && typeof el.filename === 'undefined')
    ) {
      throw new BadRequestException("Wrong format for previews array");
    }

    const imagesIds = dto.previews
      .filter(el => typeof el.imageId !== 'undefined')
      .map(el => el.imageId);

    if (imagesIds.length > 0) {
      const images = await this.imageRepository.findAll({
        where: {
          id: { [Op.or]: imagesIds },
        },
        raw: true,
      });

      if (images.length !== imagesIds.length) {
        throw new BadRequestException("At least one image with imageId doesn\'t exist");
      }
    }
  }

  private assignIndexes(details: {text?: string, id?: number, detailType: DetailEnum}[]) {
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

  private async updateDetails({dto, productId, transaction = null}: {productId: number, dto: UpdateProductDto, transaction?: Transaction}) {
    // Добавляем индексы к описаниям, чтобы учесть порядок в котором они будут отображаться
    const detailsWithIndexes = this.assignIndexes(dto.details);

    // Получаем все описания для данного продукта
    const fullDetails = await this.detailRepository.findAll({
      where: {productId},
    });
    // Находим те описания, которые есть в бд, но нет в dto обновления
    const detailsToDelete = fullDetails.filter(d =>
      !dto.details.find(el => el.id === d.dataValues.id)
    );
    // Удаляем из бд все описания, которых нет в dto
    if (detailsToDelete.length > 0) {
      await this.detailRepository.destroy({
        where: {id: { [Op.or]: detailsToDelete.map(el => el.dataValues.id) }, },
        transaction,
      });
    }

    // Выделяем все описания которые уже существуют в бд
    const detailsToUpdate = detailsWithIndexes.filter(el => typeof el.id === 'number');
    // Создаем массив промисов обновления описаний
    const detailsUpdatePromises = detailsToUpdate.map(dt => {
      // Находим описание в бд, соответствующее текущему
      const dbDetail = fullDetails.find(el => el.dataValues.id === dt.id);
      if (!dbDetail) {
        throw new BadRequestException("Some of details doesn't exist");
      }

      if (dbDetail.dataValues.index !== dt.index || dbDetail.dataValues.text !== dt.text) {
        return dbDetail.update({
          index: dt.index,
          text: dt.text,
        }, {transaction});
      }
    });

    // Ожидаем обновления
    await Promise.all(detailsUpdatePromises);
  }

  private async updatePreviews(
    {dtoFiles, files, dtoPreviews, productId, transaction}:
    {
      dtoFiles: {filename: string, index: number}[],
      dtoPreviews: {imageId: number, index: number}[],
      productId: number,
      transaction?: Transaction,
      files: Express.Multer.File[]
    }
  ) {
    // Получаем все превью продукта
    const fullPreviews = await this.previewRepository.findAll({
      where: {productId},
      raw: true,
    });
    // Находим те превью, которые есть в бд, но нет в dto обновления
    const previewsToDelete = fullPreviews.filter(p =>
      !dtoPreviews.find(el => el.imageId === p.imageId)
    );

    // Находим превью с изображениями к удалению, которые не относятся к текущему продукту,
    // чтобы понять что удалять, а что нет
    const otherPreviewsWithSuchImages = await this.previewRepository.findAll({
      where: {
        productId: { [Op.ne]: productId},
        imageId: { [Op.or]: previewsToDelete.map(el => el.imageId) }
      },
      raw: true,
    });
    // Фильтруем картинки, получаем только те, которые используются как превью для только этого продукта
    const imagesIdsToDelete = previewsToDelete
      .filter(p => !otherPreviewsWithSuchImages.find(el => el.imageId === p.imageId))
      .map(el => el.imageId);

    const [_, createdImages] = await Promise.all([
      // Удаляем картинки, за ними автоматом подтянутся превью
      this.imageService.deleteImages({
        imageIds: imagesIdsToDelete,
        transaction
      }),
      // Загружаем файлы и создаем новые картинки
      this.createMultipleImages({files, dtoFiles, transaction}),
    ]);

    // Находим те изображения, которые существуют в бд и не установлены как превью, но есть в dto
    const imagesToAdd = dtoPreviews.filter(p =>
      !fullPreviews.find(el => el.imageId === p.imageId)
    );
    // Находим те превью, которые надо обновить
    const previewsToUpdate = dtoPreviews.filter(p =>
      fullPreviews.find(el => el.imageId === p.imageId && el.index !== p.index)
    );

    const updatePreviewsPromises = previewsToUpdate.map(el => (
      this.previewRepository.update(
        {index: el.index},
        {
          where: {imageId: el.imageId, productId},
          transaction
        },
      )
    ));

    await Promise.all(updatePreviewsPromises);

    // Данные для создания превью
    const previewBulkCreateData = [...imagesToAdd, ...createdImages].map(el => {
      return { imageId: el.imageId, productId, index: el.index, }
    });

    // Создаем превью
    await this.previewRepository.bulkCreate(previewBulkCreateData, {transaction});
  }

  private async updateTags({tagIds, productId, transaction}: {tagIds: number[], productId: number, transaction?: Transaction}) {
    return await this.tagService.connectTagsToProduct({tagIds, productId, transaction});
  }

  private areIndexesUnique(arr: { index: number, [key: string]: any }[]) {
    const seen = new Set<number>();

    for (const item of arr) {
      if (seen.has(item.index)) {
        throw new BadRequestException('Indexes in arrays must be unique');
      }
      seen.add(item.index);
    }
  }

  // Создание продукта
  async createProduct(dto: CreateProductDto, files: Express.Multer.File[]) {
    await this.checkClassValidatorErrors(CreateProductDto, dto);

    const candidates = await this.productRepository.findAll({
      where: {
        article: dto.article,
      },
      raw: true,
    });

    // Проверка артикула
    const articleCandidate = candidates.find(
      (el) => el.article === dto.article,
    );
    if (articleCandidate) {
      throw new BadRequestException('Product with such article already exists');
    }

    dto.details = dto.details.filter(el => el.text.length > 0);

    const descriptions =
      this.reformatDetails(dto.details, DetailEnum.DESCRIPTION);
    const specifications =
      this.reformatDetails(dto.details, DetailEnum.SPECIFICATION);
    const equipment =
      this.reformatDetails(dto.details, DetailEnum.EQUIPMENT);

    if (descriptions.length === 0) {
      throw new BadRequestException('Product must have at least 1 description');
    }

    // Проверяем информацию
    await this.checkSomeDtoInformation(dto);

    // Проверяем индексы массива previews
    this.areIndexesUnique(dto.previews);

    const transaction = await this.sequelize.transaction();

    try {
      // productAttrs - атрибуты для создания продукта.
      // dtoPreviews - объекты, которые относятся к уже существующим картинкам.
      // dtoFiles - объекты, которые относятся к новым картинкам.
      const {productAttrs, dtoPreviews, dtoFiles} = this.getAttrsForProduct(dto);

      // Создаем продукт
      const product = await this.productRepository.create(productAttrs, {transaction});

      // Данные для создания описаний
      const detailsBulkCreateData =
        [...descriptions, ...specifications, ...equipment].map(el => {
          return { ...el, productId: product.dataValues.id }
        });

      const functionsToAwait: Promise<any>[] = [
        // Создаем все описания
        this.detailRepository.bulkCreate(detailsBulkCreateData, {transaction}),
        // Создание связей TagProduct
        this.tagService.connectTagsToProduct({tagIds: dto.tagIds, productId: product.id, transaction}),
      ];

      // Добавляем данные
      await Promise.all(functionsToAwait);

      if (typeof dto.oldPrice !== 'undefined' && typeof dto.promotionPercentage !== 'undefined') {
        // Добавляем тег скидки
        await this.tagService.updatePromotionForProduct({productId: product.id, transaction, toCreate: true})
      }

      // Загружаем файлы и создаем новые картинки
      const createdImages = await this.createMultipleImages({files, dtoFiles, transaction});

      // Данные для создания превью
      const previewBulkCreateData = [...dtoPreviews, ...createdImages].map(el => {
        return { imageId: el.imageId, productId: product.dataValues.id, index: el.index, }
      });

      // Создаем превью
      await this.previewRepository.bulkCreate(previewBulkCreateData, {transaction});

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  // Обновление данных о продукте
  async updateProduct(dto: UpdateProductDto, files: Express.Multer.File[]) {
    await this.checkClassValidatorErrors(UpdateProductDto, dto);

    const product = await this.productRepository.findByPk(dto.id);

    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (product.dataValues.article !== dto.article) {
      const candidateArticle = await this.productRepository.findOne(
        {where: {article: dto.article}}
      );

      if (candidateArticle) {
        throw new BadRequestException("Product with such article already exists");
      }
    }

    if (dto.details.find(el => typeof el.id === 'undefined' && el.text.length === 0)) {
      throw new BadRequestException('Length of description must be greater than 0');
    }

    // Проверяем информацию
    await this.checkSomeDtoInformation(dto);

    // Проверяем индексы массива previews
    this.areIndexesUnique(dto.previews);

    const descriptions =
      this.reformatDetails(dto.details, DetailEnum.DESCRIPTION);

    if (descriptions.length === 0) {
      throw new BadRequestException('Product must have at least 1 description');
    }

    const transaction = await this.sequelize.transaction();

    try {
      // productAttrs - атрибуты для создания продукта.
      // dtoPreviews - объекты, которые относятся к уже существующим картинкам.
      // dtoFiles - объекты, которые относятся к новым картинкам.
      const {productAttrs, dtoPreviews, dtoFiles} = this.getAttrsForProduct(dto);

      const functionsToAwait: Promise<any>[] = [
        // Обновление данных о продукте
        product.update(productAttrs, {transaction}),
        // Обновляем описания
        this.updateDetails({dto, productId: product.dataValues.id, transaction}),
        // Обновляем теги
        this.updateTags({tagIds: dto.tagIds, productId: product.dataValues.id, transaction})
      ];

      if (typeof dto.oldPrice !== 'undefined' && typeof dto.promotionPercentage !== 'undefined') {
        functionsToAwait.push(
          // Создаем связь с тегом акции если указали скидку
          this.tagService.updatePromotionForProduct({productId: product.id, transaction, toCreate: true})
        );
      } else {
        functionsToAwait.push(
          // Создаем связь с тегом акции если указали скидку
          this.tagService.updatePromotionForProduct({productId: product.id, transaction, toCreate: false})
        );
      }

      await Promise.all(functionsToAwait);

      // Обновляем превью
      await this.updatePreviews({dtoFiles, dtoPreviews, files, transaction, productId: product.dataValues.id});

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  // Получение информации о товарах
  async getProductsByIdentifier(dto: GetProductDto) {

    let options = {};
    let priceOptions = {};

    if (dto.tagIds.length > 0) {
      options['tagIds'] = dto.tagIds;
    }

    // Если есть артикул, то ищем строго по нему
    if (dto.article.length > 0) {
      options['article'] = dto.article;
    }

    // Если есть id, то ищем строго по id
    if (dto.id !== -1) {
      options['id'] = dto.id;
    }

    // Если есть поисковой запрос, то ищем любое совпадение в артикуле и id
    if (dto.finder.length > 0) {
      options['name'] = { [Op.iLike]: `%${dto.finder}%` };
      options['article'] = { [Op.iLike]: `%${dto.finder}%` };
    }

    // Добавляем нижнюю границу цены
    if (dto.minPrice !== -1) {
      priceOptions[Op.and] = [ { [Op.gte]: Number(dto.minPrice) } ];
    }

    // Добавляем верхнюю границу цены
    if (dto.minPrice !== -1) {
      priceOptions[Op.and] = [...priceOptions[Op.and], { [Op.lte]: Number(dto.maxPrice) }];
    }

    if (priceOptions[Op.and]) {
      options['price'] = priceOptions;
    }

    if (dto.productGroupId !== -1) {
      options['productGroupId'] = dto.productGroupId;
    }

    return await this.collectDataForProduct({options, limit: dto.limit, page: dto.page });
  }

  async getProductForBasket(articles: string[]) {
    if (articles.length === 0) {
      return [];
    }

    const products = await this.productRepository.findAll({
      where: {
        article: { [Op.or]: articles },
        availability: true,
        visibility: true,
      },
      raw: true,
    });

    if (products.length === 0) {
      return [];
    }
    
    const productsData = await this.collectDataForProduct({
      options: {
        article: { [Op.or]: products.map(el => el.article) },
      },
      limit: products.length,
      page: 1,
    });

    return productsData.records;
  }
}
