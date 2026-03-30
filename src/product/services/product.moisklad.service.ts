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

  @Cron('0 0 0,2 * * *')
  private async compareProducts() {
    const products = await this.productRepository.findAll({ raw: true });
    const basicKey = this.configService.get<number>('MOI_SKLAD_BASIC');

    const productsNotAvailable: number[] = [];
    const productsUpdateCount:
      { id: number, count: number, availability: boolean }[] = [];

    let counter = 0;

    for (const product of products) {
      const skladProductArticle: AxiosResponse<MoiSkladProductsResponse> = await firstValueFrom(
        this.http.get(
          `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=article=${product.article}`,
          {
            headers: { Authorization: `Basic ${basicKey}` },
          })
      );
      const skladProductCode: AxiosResponse<MoiSkladProductsResponse> = await firstValueFrom(
        this.http.get(
          `https://api.moysklad.ru/api/remap/1.2/entity/assortment?filter=code=${product.article}`,
          {
            headers: { Authorization: `Basic ${basicKey}` },
          })
      );

      const skladProductArticleRes = skladProductArticle.data;
      const skladProductCodeRes = skladProductCode.data;

      let skladProduct: any;

      if (skladProductArticleRes.rows.length > 0) {
        skladProduct = skladProductArticleRes.rows[0];
      } else if (skladProductCodeRes.rows.length > 0) {
        skladProduct = skladProductCodeRes.rows[0];
      }

      if (!skladProduct) {
        continue;
      }

      if (Number(skladProduct.reserve) !== Number(product.count)) {
        productsUpdateCount.push({
          id: product.id,
          count: Number(skladProduct.reserve),
          availability: Number(skladProduct.reserve) > 0,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      counter += 1;

      if (counter >= 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        counter = 0;
      }
    }

    const promises: Promise<any>[] = [];

    if (productsNotAvailable.length > 0) {
      promises.push(
        this.productRepository.update(
          { availability: false },
          {
            where: {
              id: {
                [Op.or]: productsNotAvailable
              }
            }
          }
        )
      );
    }

    if (productsUpdateCount.length > 0) {
      for (const updateData of productsUpdateCount) {
        promises.push(
          this.productRepository.update(
            { availability: updateData.availability, count: updateData.count },
            {
              where: {
                id: {
                  [Op.or]: productsNotAvailable
                }
              }
            }
          )
        )
      }
    }

    await Promise.all(promises);
  }
}