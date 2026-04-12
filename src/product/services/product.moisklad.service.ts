import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Product } from "../models/product.model";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { MoiSkladProductsResponse } from "../lib/moisklad.types";
import { Op } from "sequelize";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import * as crypto from 'crypto';

@Injectable()
export class ProductMoiskladService implements OnModuleInit {

  constructor(
    @InjectModel(Product)
    private readonly productRepository: typeof Product,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
  }

  async onModuleInit(): Promise<void> {
    await this.compareProducts();
  }

  @Cron('0 */10 * * * *')
  private async compareProducts() {
    const products = await this.productRepository.findAll({ raw: true });
    const basicKey = this.configService.get<number>('MOI_SKLAD_BASIC');

    const allProducts: any[] = [];
    const productsNotAvailable: number[] = [];
    const productsUpdateCount:
      { id: number, count: number, availability: boolean }[] = [];

    let offset = 0;

    while (true) {
      const skladProducts: AxiosResponse<MoiSkladProductsResponse> = await firstValueFrom(
        this.http.get(
          `https://api.moysklad.ru/api/remap/1.2/entity/assortment?offset=${offset}`,
          {
            headers: { Authorization: `Basic ${basicKey}` },
          })
      );
      const skladProductsData = skladProducts.data;

      allProducts.push(...skladProductsData.rows);

      offset += 1000;

      if (Number(skladProductsData.meta.size) <= offset) {
        break;
      }
    }

    for (const product of products) {
      const skladProductArticleRes = allProducts.find(
        el => el.article?.toLowerCase() === product.article.toLowerCase()
      );
      const skladProductCodeRes = allProducts.find(
        el => el.code?.toLowerCase() === product.article.toLowerCase()
      );

      let skladProduct: any;

      if (skladProductArticleRes) {
        skladProduct = skladProductArticleRes;
      } else if (skladProductCodeRes) {
        skladProduct = skladProductCodeRes;
      }

      if (!skladProduct) {
        continue;
      }

      if (Number(skladProduct.reserve) !== Number(product.count)) {
        const stock = Number(skladProduct.stock) > 0 ? Number(skladProduct.stock) : 0;

        productsUpdateCount.push({
          id: product.id,
          count: stock,
          availability: stock > 0,
        });
      }
    }

    if (productsNotAvailable.length > 0) {
      await this.productRepository.update(
        { availability: false },
        {
          where: {
            id: {
              [Op.or]: productsNotAvailable
            }
          }
        }
      )
    }

    if (productsUpdateCount.length > 0) {
      for (const updateData of productsUpdateCount) {
        await this.productRepository.update(
          { availability: updateData.availability, count: updateData.count },
          {
            where: { id: updateData.id }
          }
        )
      }
    }
  }
}