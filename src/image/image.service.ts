import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Image } from "./models/image.model";
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize-typescript";
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Op, Transaction } from "sequelize";
import { Preview } from "../product/models/preview.model";

@Injectable()
export class ImageService {
  private s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @InjectModel(Image)
    private readonly imageRepository: typeof Image,
    private readonly configService: ConfigService,
    private readonly sequelize: Sequelize,
    @InjectModel(Preview)
    private readonly previewRepository: typeof Preview,
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

  async createImage({image, transaction}: {image: Express.Multer.File, transaction?: Transaction}) {
    if (!transaction) {
      transaction = await this.sequelize.transaction();
    }

    const extension = extname(image.originalname);

    if (!['.png', '.jpg', '.jpeg'].includes(extension)) {
      throw new BadRequestException("Allowed extensions: .png, .jpg, .jpeg");
    }

    const filename = `${randomUUID()}${extension}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: filename,
      Body: image.buffer,
      ContentType: image.mimetype,
    }

    const imageItem = await this.imageRepository.create({ filename }, { transaction });
    await this.s3.send(new PutObjectCommand(uploadParams));

    return imageItem.dataValues;
  }

  async deleteImages({imageIds, transaction = null}: {imageIds: number[], transaction?: Transaction}) {
    if (imageIds.length !== 0) {
      const images = await this.imageRepository.findAll({
        where: {
          id: { [Op.or]: imageIds },
        }
      });

      const deleteParams = {
        Bucket: this.bucketName,
        Delete: {
          Objects: images.map(el => ({Key: el.dataValues.filename})),
          Quiet: true,
        }
      }

      await this.imageRepository.destroy({
        where: {
          id: { [Op.or]: imageIds },
        },
        transaction
      });

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
}
