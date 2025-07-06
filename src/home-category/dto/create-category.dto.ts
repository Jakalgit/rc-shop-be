import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class CreateCategoryDto {

  @IsNumber()
  @IsNotEmpty()
  groupId: number;

  @IsOptional()
  imageId?: number;
}