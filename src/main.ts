import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const PORT = process.env.PORT || 5000;
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    app.enableCors({
      origin: '*',
    });

    await app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (e) {
    console.error(e);
  }
}

bootstrap();
