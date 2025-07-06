import { Module } from '@nestjs/common';
import { ProductGroupController } from './product-group.controller';
import { ProductGroupService } from './product-group.service';
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductGroup } from "./models/product-group.model";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    SequelizeModule.forFeature([ProductGroup]),
    AuthModule,
  ],
  controllers: [ProductGroupController],
  providers: [ProductGroupService]
})
export class ProductGroupModule {}
