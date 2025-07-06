import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";
import pg from "pg";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductModule } from './product/product.module';

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
        autoLoadModels: true,
      })
    }),
    ProductModule
  ],
})
export class AppModule {}
