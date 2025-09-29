import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";
import pg from "pg";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductModule } from './product/product.module';
import { ImageModule } from './image/image.module';
import { TagModule } from './tags/tag.module';
import { ContactModule } from './contact/contact.module';
import { AuthModule } from './auth/auth.module';
import { Contact } from "./contact/models/contact.model";
import { Tag } from "./tags/models/tag.model";
import { Image } from "./image/models/image.model";
import { Preview } from "./product/models/preview.model";
import { Group } from "./tags/models/group.model";
import { TagProduct } from "./tags/models/tag-product.model";
import { Detail } from "./product/models/detail.model";
import { Product } from "./product/models/product.model";
import { RepairServiceModule } from './repair-service/repair-service.module';
import { RepairService } from "./repair-service/models/repair-service";
import { UserRequestModule } from './user-request/user-request.module';
import { UserRequest } from "./user-request/models/user-request.model";
import { ProductGroupModule } from './product-group/product-group.module';
import { ProductGroup } from "./product-group/models/product-group.model";
import { ProfileModule } from './profile/profile.module';
import { PromotionSliderModule } from './promotion-slider/promotion-slider.module';
import { SliderItem } from "./promotion-slider/models/slider-item";
import { Profile } from "./profile/models/profile.model";
import { MailerModule } from './mailer/mailer.module';
import { RedisModule } from './redis/redis.module';
import { OrderModule } from './order/order.module';
import { Order } from "./order/models/order.model";
import { OrderItem } from "./order/models/order_item.model";
import { OrderAction } from "./order/models/order_action.model";
import { PageBlockModule } from './page-block/page-block.module';
import { PageBlock } from "./page-block/models/page-block.model";
import { CategoryBlockModule } from './category-block/category-block.module';
import { CategoryBlock } from "./category-block/models/category-block.model";
import { CategoryLink } from "./category-block/models/category-link.model";
import { CategorySubBlock } from "./category-block/models/category-subblock.model";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [path.join(__dirname, '../.env')],
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        dialectModule: pg,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [Contact, Product, Tag, TagProduct, Image, Preview, Detail, PageBlock, CategoryBlock, CategoryLink, CategorySubBlock,
          Group, RepairService, UserRequest, ProductGroup, SliderItem, Profile, Order, OrderItem, OrderAction],
        autoLoadModels: true,
      })
    }),
    ProductModule,
    ImageModule,
    TagModule,
    ContactModule,
    AuthModule,
    RepairServiceModule,
    UserRequestModule,
    ProductGroupModule,
    ProfileModule,
    PromotionSliderModule,
    MailerModule,
    RedisModule,
    OrderModule,
    PageBlockModule,
    CategoryBlockModule
  ],
})
export class AppModule {}
