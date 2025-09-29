import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  try {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);
    const isProd = process.env.NODE_ENV === 'production';

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })
    );

    app.enableCors({
      origin: isProd ? ['https://manager.work-rc.ru', 'https://work-rc.ru'] : '*',
      credentials: true,
    });

    await app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (e) {
    console.error(e);
  }
}

bootstrap();
