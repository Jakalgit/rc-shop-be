import { Injectable } from "@nestjs/common";

@Injectable()
export class CategoryBlockSharedService {

  constructor() {
  }

  determineBlockWithImageToUpdate<T extends object = {}, K extends object = {}>(
    blockDto: {preview: {imageId?: number, filename?: string}} & T,
    blockDb: {imageId: number, id?: number} & K,
    fieldsToCompare: string[],
    files: Express.Multer.File[],
  ) {
    const baseNeedUpdate = !fieldsToCompare.every(
      key => blockDb[key] === blockDto[key]
    );

    let imageAction: "none" | "replace" | "create" = "none";
    let newImageFile: Express.Multer.File | null = null;

    if (blockDto.preview?.imageId !== undefined) {
      if (blockDto.preview.imageId !== blockDb.imageId) {
        // новый id → надо заменить
        imageAction = "replace";
      } else {
        // совпадает → ничего
        imageAction = "none";
      }
    } else if (blockDto.preview?.filename) {
      // пришел новый файл по имени
      newImageFile = files.find(f => f.originalname === blockDto.preview.filename) || null;
      if (newImageFile) {
        imageAction = "create";
      }
    }

    const needUpdate = baseNeedUpdate || imageAction !== "none";

    return {
      id: blockDb.id,
      needUpdate,
      imageAction,
      newImageFile,
      blockDto,
      blockDb
    };
  }
}