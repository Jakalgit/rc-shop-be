import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SequelizeModule } from "@nestjs/sequelize";
import { Order } from "./models/order.model";
import { OrderItem } from "./models/order_item.model";
import { OrderAction } from "./models/order_action.model";
import { ProfileModule } from "../profile/profile.module";
import { ProductModule } from "../product/product.module";
import { AuthModule } from "../auth/auth.module";
import { Profile } from "../profile/models/profile.model";
import { OrderHelpersService } from "./order-helpers.service";
import { MailerModule } from "../mailer/mailer.module";

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Order, OrderItem, OrderAction, Profile]),
    ProfileModule,
    ProductModule,
    MailerModule,
  ],
  providers: [OrderService, OrderHelpersService],
  controllers: [OrderController]
})
export class OrderModule {}
