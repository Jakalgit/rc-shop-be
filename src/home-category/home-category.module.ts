import { Module } from '@nestjs/common';
import { HomeCategoryController } from './home-category.controller';
import { HomeCategoryService } from './home-category.service';

@Module({
  controllers: [HomeCategoryController],
  providers: [HomeCategoryService]
})
export class HomeCategoryModule {}
