import { DetailEnum } from "../../enums/detail.enum";
import { IsNotEmpty, IsNumber, IsOptional, Length, Min } from "class-validator";

export class BaseProductDto {

  @IsNotEmpty({message: "Attribute name is required"})
  @Length(2, 100, {message: "Name size: form 2 to 100 symbols"})
  name: string;

  @IsNotEmpty({message: "Attribute availability is required"})
  availability: boolean;

  @IsNotEmpty({message: "Attribute visibility is required"})
  visibility: boolean;

  @IsNotEmpty({message: "Attribute count is required"})
  @Min(0, {message: "Count of products must be greater than or equal 0"})
  count: number;

  @IsNotEmpty({message: "Attribute price is required"})
  @Min(1, {message: "Product's price must be greater than or equal 1"})
  price: number;

  @IsNotEmpty({message: "Attribute wholesalePrice is required"})
  @Min(1, {message: "Product's wholesale price must be greater than or equal 1"})
  wholesalePrice: number;

  @IsNotEmpty({message: "Attribute article is required"})
  article: string;

  oldPrice?: number;
  promotionPercentage?: number;

  weight?: number;
  width?: number;
  height?: number;
  length?: number;

  tuningUrl?: string;
  partsUrl?: string;

  @IsOptional()
  @IsNumber({}, {message: 'Attribute productGroupId must be a number'})
  productGroupId?: number;


  @IsNotEmpty({message: "Attribute previews is required"})
  previews: {imageId?: number, filename?: string, index: number}[];

  @IsNotEmpty({message: "Attribute tagIds is required"})
  tagIds: number[];
}

export class CreateProductDto extends BaseProductDto{

  @IsNotEmpty({message: "Attribute details is required"})
  details: {text: string, detailType: DetailEnum}[];
}