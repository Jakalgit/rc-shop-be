import { BaseProductDto } from "./create-product.dto";
import { IsNotEmpty } from "class-validator";
import { DetailEnum } from "../../enums/detail.enum";

export class UpdateProductDto extends BaseProductDto {

  id: number;

  @IsNotEmpty({message: "Attribute details is required"})
  details: {text?: string, id?: number, detailType: DetailEnum}[];
}