import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Product } from "../models/product.model";
import { ImageService } from "../../image/image.service";
import { Preview } from "../models/preview.model";
import { Op } from "sequelize";

@Injectable()
export class ProductGettersService {

  constructor(
    @InjectModel(Product)
    private readonly productRepository: typeof Product,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
    private readonly imageService: ImageService,
  ) {}

  async getProductsSitemap() {
    return await this.productRepository.findAll({
      where: { visibility: true },
      raw: true,
      attributes: {
        include: ['article', 'updatedAt'],
      },
    });
  }

  async getProductsForProductGroup(productGroupId: number) {
    const products = await this.productRepository.findAll({
      where: { productGroupId },
      raw: true,
    });

    const previews = await this.previewRepository.findAll({
      where: {
        productId: { [Op.or]: products.map(el => el.id) },
        index: 0,
      },
      raw: true,
    });

    const images = await this.imageService.findImages({
      where: {
        id: { [Op.or]: previews.map(el => el.imageId) }
      },
      raw: true,
    });

    return products.map(el => {
      const preview = previews.find(p => p.productId === el.id);
      const image = images.find(i => i.id === preview.imageId);

      return {
        article: el.article,
        filename: image.filename
      }
    });
  }
}