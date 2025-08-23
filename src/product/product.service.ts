import { BadRequestException, Injectable } from '@nestjs/common';
import { Product } from './models/product.model';
import { InjectModel } from '@nestjs/sequelize';
import { Preview } from './models/preview.model';
import { Detail } from './models/detail.model';
import { CreateProductDto } from './dto/create-product.dto';
import { Op } from 'sequelize';
import { DetailEnum } from '../enums/detail.enum';
import { Sequelize } from 'sequelize-typescript';
import { TagService } from '../tags/tag.service';
import { GetProductDto } from './dto/get-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { applyRangeFilter } from '../helpers/applyRangeFilter';
import { ProductHelpersService } from "./product-helpers.service";
import { ProductUpdatesService } from "./product-updates.service";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product)
    private readonly productRepository: typeof Product,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
    @InjectModel(Detail)
    private readonly detailRepository: typeof Detail,
    private readonly tagService: TagService,
    private readonly productHelpersService: ProductHelpersService,
    private readonly productUpdatesService: ProductUpdatesService,
    private readonly sequelize: Sequelize,
  ) {}

  // Создание продукта
  async createProduct(dto: CreateProductDto, files: Express.Multer.File[]) {
    await this.productHelpersService.checkClassValidatorErrors(CreateProductDto, dto);

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
      throw new BadRequestException('Товар с таким артиклем уже существует');
    }

    dto.details = dto.details.filter((el) => el.text.length > 0);

    const descriptions = this.productHelpersService.reformatDetails(
      dto.details,
      DetailEnum.DESCRIPTION,
    );
    const specifications = this.productHelpersService.reformatDetails(
      dto.details,
      DetailEnum.SPECIFICATION,
    );
    const equipment = this.productHelpersService.reformatDetails(
      dto.details, DetailEnum.EQUIPMENT
    );

    if (descriptions.length === 0) {
      throw new BadRequestException('Товар должен иметь как минимум 1 описание (description)');
    }

    // Проверяем информацию
    await this.productHelpersService.checkSomeDtoInformation(dto);

    // Проверяем индексы массива previews
    this.productHelpersService.areIndexesUnique(dto.previews);

    const transaction = await this.sequelize.transaction();

    try {
      // productAttrs - атрибуты для создания продукта.
      // dtoPreviews - объекты, которые относятся к уже существующим картинкам.
      // dtoFiles - объекты, которые относятся к новым картинкам.
      const { productAttrs, dtoPreviews, dtoFiles } =
        this.productHelpersService.getAttrsForProduct(dto);

      // Создаем продукт
      const product = await this.productRepository.create(productAttrs, {
        transaction,
      });

      // Данные для создания описаний
      const detailsBulkCreateData = [
        ...descriptions,
        ...specifications,
        ...equipment,
      ].map((el) => {
        return { ...el, productId: product.dataValues.id };
      });

      const functionsToAwait: Promise<any>[] = [
        // Создаем все описания
        this.detailRepository.bulkCreate(detailsBulkCreateData, {
          transaction,
        }),
        // Создание связей TagProduct
        this.tagService.connectTagsToProduct({
          tagIds: dto.tagIds,
          productId: product.id,
          transaction,
        }),
      ];

      // Добавляем данные
      await Promise.all(functionsToAwait);

      if (
        typeof dto.oldPrice === 'number' &&
        typeof dto.promotionPercentage === 'number'
      ) {
        // Добавляем тег скидки
        await this.tagService.updatePromotionForProduct({
          productId: product.id,
          transaction,
          toCreate: true,
        });
      }

      // Загружаем файлы и создаем новые картинки
      const createdImages = await this.productHelpersService.createMultipleImages({
        files,
        dtoFiles,
        transaction,
      });

      // Данные для создания превью
      const previewBulkCreateData = [...dtoPreviews, ...createdImages].map(
        (el) => {
          return {
            imageId: el.imageId,
            productId: product.dataValues.id,
            index: el.index,
          };
        },
      );

      // Создаем превью
      await this.previewRepository.bulkCreate(previewBulkCreateData, {
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  // Обновление данных о продукте
  async updateProduct(dto: UpdateProductDto, files: Express.Multer.File[]) {
    await this.productHelpersService.checkClassValidatorErrors(UpdateProductDto, dto);

    const product = await this.productRepository.findByPk(dto.id);

    if (!product) {
      throw new BadRequestException('Товар не найден');
    }

    if (product.dataValues.article !== dto.article) {
      const candidateArticle = await this.productRepository.findOne({
        where: { article: dto.article },
      });

      if (candidateArticle) {
        throw new BadRequestException(
          'Товар с таким артиклем уже существует',
        );
      }
    }

    if (
      dto.details.find(
        (el) => typeof el.id === 'undefined' && el.text.length === 0,
      )
    ) {
      throw new BadRequestException(
        'Длина текста описания должна быть больше 0',
      );
    }

    // Проверяем информацию
    await this.productHelpersService.checkSomeDtoInformation(dto);

    // Проверяем индексы массива previews
    this.productHelpersService.areIndexesUnique(dto.previews);

    const descriptions = this.productHelpersService.reformatDetails(
      dto.details,
      DetailEnum.DESCRIPTION,
    );

    if (descriptions.length === 0) {
      throw new BadRequestException('Товар должен иметь как минимум 1 описание (description)');
    }

    const transaction = await this.sequelize.transaction();

    try {
      // productAttrs - атрибуты для создания продукта.
      // dtoPreviews - объекты, которые относятся к уже существующим картинкам.
      // dtoFiles - объекты, которые относятся к новым картинкам.
      const { productAttrs, dtoPreviews, dtoFiles } =
        this.productHelpersService.getAttrsForProduct(dto);

      const functionsToAwait: Promise<any>[] = [
        // Обновление данных о продукте
        product.update(productAttrs, { transaction }),
        // Обновляем описания
        this.productUpdatesService.updateDetails({
          dto,
          productId: product.dataValues.id,
          transaction,
        }),
        // Обновляем теги
        this.productUpdatesService.updateTags({
          tagIds: dto.tagIds,
          productId: product.dataValues.id,
          transaction,
        }),
      ];

      if (
        typeof dto.oldPrice === 'number' &&
        typeof dto.promotionPercentage === 'number'
      ) {
        functionsToAwait.push(
          // Создаем связь с тегом акции если указали скидку
          this.tagService.updatePromotionForProduct({
            productId: product.id,
            transaction,
            toCreate: true,
          }),
        );
      } else {
        functionsToAwait.push(
          // Создаем связь с тегом акции если указали скидку
          this.tagService.updatePromotionForProduct({
            productId: product.id,
            transaction,
            toCreate: false,
          }),
        );
      }

      await Promise.all(functionsToAwait);

      // Обновляем превью
      await this.productUpdatesService.updatePreviews({
        dtoFiles,
        dtoPreviews,
        files,
        transaction,
        productId: product.dataValues.id,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      console.error(e);
      throw e;
    }
  }

  // Получение информации о товарах
  async getProducts(
    dto: GetProductDto,
    wholesalePriceAccess: boolean,
  ) {
    let options = {};
    let priceOptions = {};
    let wholesalePriceOptions = {};
    let isPartner = false;

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

    // Добавляем границы для обычной цены
    applyRangeFilter({
      options: priceOptions,
      minValue: dto.minPrice,
      maxValue: dto.maxPrice,
    });

    // Добавляем границы оптовой цены (только для партнеров)
    if (wholesalePriceAccess) {
      applyRangeFilter({
        options: wholesalePriceOptions,
        minValue: dto.wMinPrice,
        maxValue: dto.wMaxPrice,
      });

      isPartner = true;

      if (wholesalePriceOptions[Op.and]) {
        options['wholesalePrice'] = wholesalePriceOptions;
      }
    }

    if (priceOptions[Op.and]) {
      options['price'] = priceOptions;
    }

    if (dto.productGroupId !== -1) {
      options['productGroupId'] = dto.productGroupId;
    }

    const result = await this.productHelpersService.collectDataForProduct({
      options,
      limit: dto.limit,
      page: dto.page,
      isPartner,
    });

    return {
      ...result,
      partner: wholesalePriceAccess,
    };
  }

  async getProductForBasket(articles: string[], wholesalePriceAccess: boolean) {
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

    const productsData = await this.productHelpersService.collectDataForProduct({
      options: {
        article: { [Op.or]: products.map((el) => el.article) },
      },
      limit: products.length,
      page: 1,
      isPartner: wholesalePriceAccess,
    });

    if (wholesalePriceAccess) {
      productsData.records = productsData.records.map(el => {
        const newEl = {
          ...el,
          price: el.wholesalePrice
        }
        delete newEl.wholesalePrice;
        return newEl;
      });
    }

    return productsData.records;
  }
}
