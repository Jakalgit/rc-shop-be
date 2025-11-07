import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PartnerGuard } from '../auth/guards/partner.guard';
import { WholesalePriceAccess } from '../decorators/wholesale-price.decorator';
import { OptionalParseIntPipe } from '../helpers/optional-parse-int.pipe';
import { ProductSortEnum } from '../enums/product-sort.enum';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(AdminAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('files[]', 30))
  create(@UploadedFiles() files: Express.Multer.File[], @Body() body: any) {
    const dto: CreateProductDto = {
      ...body,
      price: Number(body.price),
      wholesalePrice: Number(body.wholesalePrice),
      count: Number(body.count),
      availability: body.availability === 'true',
      visibility: body.visibility === 'true',
      previews: JSON.parse(body.previews),
      tagIds: JSON.parse(body.tagIds),
      details: JSON.parse(body.details),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      promotionPercentage: body.promotionPercentage
        ? Number(body.promotionPercentage)
        : null,
      weight: body.weight ? Number(body.weight) : null,
      width: body.width ? Number(body.width) : null,
      height: body.height ? Number(body.height) : null,
      length: body.length ? Number(body.length) : null,
    };

    return this.productService.createProduct(dto, files);
  }

  @UseGuards(AdminAuthGuard)
  @Put('/:id')
  @UseInterceptors(FilesInterceptor('files[]', 30))
  changeProduct(
    @Param('id') id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ) {
    const dto: UpdateProductDto = {
      ...body,
      id,
      price: Number(body.price),
      wholesalePrice: Number(body.wholesalePrice),
      count: Number(body.count),
      availability: body.availability === 'true',
      visibility: body.visibility === 'true',
      previews: JSON.parse(body.previews),
      tagIds: JSON.parse(body.tagIds),
      details: JSON.parse(body.details),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      promotionPercentage: body.promotionPercentage
        ? Number(body.promotionPercentage)
        : null,
      weight: body.weight ? Number(body.weight) : null,
      width: body.width ? Number(body.width) : null,
      height: body.height ? Number(body.height) : null,
      length: body.length ? Number(body.length) : null,
    };

    return this.productService.updateProduct(dto, files);
  }

  @UseGuards(PartnerGuard)
  @Get('/catalog')
  getProducts(
    @WholesalePriceAccess() wholesalePriceAccess: boolean,
    @Query('id', new OptionalParseIntPipe()) id: number = -1,
    @Query('finder') finder: string = '',
    @Query('article') article: string = '',
    @Query('limit', new OptionalParseIntPipe()) limit: number = 1,
    @Query('page', new OptionalParseIntPipe()) page: number = 1,
    @Query(
      'tagIds',
      new ParseArrayPipe({ items: Number, separator: ',', optional: true }),
    )
    tagIds: number[] = [],
    @Query('productGroupId', new OptionalParseIntPipe())
    productGroupId: number = -1,
    @Query('minPrice', new OptionalParseIntPipe()) minPrice: number = -1,
    @Query('maxPrice', new OptionalParseIntPipe()) maxPrice: number = -1,
    @Query('wMinPrice', new OptionalParseIntPipe()) wMinPrice: number = -1,
    @Query('wMaxPrice', new OptionalParseIntPipe()) wMaxPrice: number = -1,
    @Query('sort', new OptionalParseIntPipe())
    sortType: ProductSortEnum = ProductSortEnum.DEFAULT,
    @Query('unavailable', new OptionalParseIntPipe()) showUnavailable: number = 0,
  ) {
    return this.productService.getProducts(
      {
        id,
        finder,
        article,
        limit,
        page,
        tagIds,
        productGroupId,
        maxPrice,
        minPrice,
        wMinPrice,
        wMaxPrice,
        sortType,
        showUnavailable: Boolean(showUnavailable),
      },
      wholesalePriceAccess,
    );
  }

  @UseGuards(AdminAuthGuard)
  @Get('/manager-catalog')
  getProductsForManager(
    @Query('id', new OptionalParseIntPipe()) id: number = -1,
    @Query('finder') finder: string = '',
    @Query('article') article: string = '',
    @Query('limit', new OptionalParseIntPipe()) limit: number = 1,
    @Query('page', new OptionalParseIntPipe()) page: number = 1,
    @Query(
      'tagIds',
      new ParseArrayPipe({ items: Number, separator: ',', optional: true }),
    )
    tagIds: number[] = [],
    @Query('productGroupId', new OptionalParseIntPipe())
    productGroupId: number = -1,
    @Query('minPrice', new OptionalParseIntPipe()) minPrice: number = -1,
    @Query('maxPrice', new OptionalParseIntPipe()) maxPrice: number = -1,
    @Query('wMinPrice', new OptionalParseIntPipe()) wMinPrice: number = -1,
    @Query('wMaxPrice', new OptionalParseIntPipe()) wMaxPrice: number = -1,
    @Query('sort', new OptionalParseIntPipe())
    sortType: ProductSortEnum = ProductSortEnum.DEFAULT,
    @Query('unavailable', new OptionalParseIntPipe()) showUnavailable: number = 0,
  ) {
    return this.productService.getProducts(
      {
        id,
        finder,
        article,
        limit,
        page,
        tagIds,
        productGroupId,
        maxPrice,
        minPrice,
        wMinPrice,
        wMaxPrice,
        sortType,
        showUnavailable: Boolean(showUnavailable),
      },
      true,
    );
  }

  @UseGuards(PartnerGuard)
  @Get('/basket')
  getProductsForBasket(
    @WholesalePriceAccess() wholesalePriceAccess: boolean,
    @Query(
      'cart',
      new ParseArrayPipe({ items: String, separator: ',', optional: true }),
    )
    cart: string[] = [],
  ) {
    return this.productService.getProductForBasket(cart, wholesalePriceAccess);
  }

  @Get('/sitemap')
  getProductsSitemap() {
    return this.productService.getProductsSitemap();
  }
}
