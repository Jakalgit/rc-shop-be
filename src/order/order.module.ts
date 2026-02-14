import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Order } from "./lib/models/order.model";
import { OrderItem } from "./lib/models/order_item.model";
import { OrderAction } from "./lib/models/order_action.model";
import { ProfileModule } from "../profile/profile.module";
import { ProductModule } from "../product/product.module";
import { AuthModule } from "../auth/auth.module";
import { Profile } from "../profile/models/profile.model";
import { OrderHelpersService } from "./order-helpers.service";
import { MailerModule } from "../mailer/mailer.module";
import { HttpModule } from "@nestjs/axios";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Order, OrderItem, OrderAction, Profile]),
    ProfileModule,
    ProductModule,
    MailerModule,
    HttpModule,
    TelegramModule,
  ],
  providers: [OrderService, OrderHelpersService],
  controllers: [OrderController]
})
export class OrderModule {}
