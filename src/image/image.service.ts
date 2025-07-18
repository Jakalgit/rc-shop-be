import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Image } from "./models/image.model";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize-typescript";
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { FindOptions, Op, Transaction } from "sequelize";

@Injectable()
export class ImageService {
  private s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @InjectModel(Image)
    private readonly imageRepository: typeof Image,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get<string>("AWS_REGION"),
      endpoint: this.configService.get<string>("AWS_ENDPOINT_URL"),
      credentials: {
        accessKeyId: this.configService.get<string>("AWS_ACCESS_KEY"),
        secretAccessKey: this.configService.get<string>("AWS_SECRET_ACCESS_KEY"),
      },
    });

    this.bucketName = this.configService.get<string>("AWS_BUCKET_NAME");
  }

  async createImages({ images, transaction }: { images: Express.Multer.File[], transaction?: Transaction }) {
    let commit = false;
    if (!transaction) {
      transaction = await this.sequelize.transaction();
      commit = true;
    }

    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const uploadPromises: Promise<any>[] = [];
    const imageItems: (Image & { original: string })[] = [];

    for (const image of images) {
      const extension = extname(image.originalname);

      // Проверяем расширение
      if (!allowedExtensions.includes(extension)) {
        throw new BadRequestException(`Allowed extensions: ${allowedExtensions.join(', ')}`);
      }

      // Генерируем уникальное имя файла
      const filename = `${randomUUID()}${extension}`;

      // Параметры для загрузки в S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: filename,
        Body: image.buffer,
        ContentType: image.mimetype,
      };

      // Создаём запись в базе данных
      const imageItem = await this.imageRepository.create({ filename }, { transaction });
      imageItems.push({
        ...imageItem.dataValues,
        original: image.originalname
      } as Image & { original: string });

      // Добавляем задачу загрузки в S3 в массив промисов
      uploadPromises.push(this.s3.send(new PutObjectCommand(uploadParams)));
    }

    // Выполняем все загрузки в S3 параллельно
    await Promise.all(uploadPromises);

    // Если всё успешно, коммитим транзакцию
    if (commit) {
      await transaction.commit();
    }

    // Возвращаем массив созданных записей
    return imageItems;
  }

  async createImage({image, transaction}: {image: Express.Multer.File, transaction?: Transaction}) {
    return (await this.createImages({images: [image], transaction}))[0];
  }

  // Метод для удаления нескольких изображений из базы данных и S3
  async deleteImages({ imageIds, transaction = null }: { imageIds: number[], transaction?: Transaction }) {
    // Проверяем, что передан непустой массив ID изображений
    if (imageIds.length !== 0) {
      // Получаем записи изображений из базы данных по переданным ID
      const images = await this.imageRepository.findAll({
        where: {
          id: { [Op.or]: imageIds }, // Используем оператор OR для поиска всех ID
        }
      });

      // Формируем параметры для удаления объектов из S3
      const deleteParams = {
        Bucket: this.bucketName, // Имя бакета S3
        Delete: {
          Objects: images.map(el => ({ Key: el.dataValues.filename })), // Список ключей файлов для удаления
          Quiet: true, // Режим тихого удаления (без подробного ответа от S3)
        }
      };

      // Удаляем записи из базы данных
      await this.imageRepository.destroy({
        where: {
          id: { [Op.or]: imageIds }, // Удаляем записи по переданным ID
        },
        transaction // Используем переданную или null транзакцию
      });

      // Отправляем команду на удаление файлов из S3
      await this.s3.send(new DeleteObjectsCommand(deleteParams));
    }
  }

  async getImages(page: number, limit: number) {
    const images = await this.imageRepository.findAndCountAll({
      raw: true,
      limit,
      offset: (page - 1) * limit,
    });
  }

  async findImages(options?: FindOptions<Image>) {
    return await this.imageRepository.findAll(options)
  }
}
