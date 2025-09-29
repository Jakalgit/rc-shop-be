import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Expose, Transform } from "class-transformer";

export class LinkBlockDto {

  @Expose()
  @IsNotEmpty({message: "Attribute 'id' in link required"})
  @IsNumber()
  id: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'linkText' in link required"})
  @IsString()
  linkText: string;

  @Expose()
  @IsNotEmpty({message: "Attribute 'link' in link required"})
  @IsString()
  link: string;

  @Expose()
  @IsNotEmpty({message: "Attribute 'index' in link required"})
  @IsNumber()
  index: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'categoryBlockId' in link required"})
  @IsNumber()
  categoryBlockId: number;
}

export class SubBlockDto {

  @Expose()
  @IsNotEmpty({message: "Attribute 'id' in sub_block required"})
  @IsNumber()
  id: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'blockLink' in sub_block required"})
  @IsString()
  blockLink: string;

  @Expose()
  @IsNotEmpty({message: "Attribute 'name' in sub_block required"})
  @IsString()
  name: string;

  @Expose()
  @IsNotEmpty({message: "Attribute 'index' in sub_block required"})
  @IsNumber()
  index: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'categoryBlockId' in sub_block required"})
  @IsNumber()
  categoryBlockId: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'preview' in sub_block is required"})
  preview: {imageId?: number, filename?: string};
}

export class CategoryBlockDto {
  @Expose()
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @Expose()
  @IsString()
  blockText: string;

  @Expose()
  @IsNumber()
  index: number;

  @Expose()
  @IsNotEmpty({message: "Attribute 'preview' is required"})
  preview: {imageId?: number, filename?: string};
}

export class UpdateCategoryBlockDto {

  @IsNotEmpty({message: "Attribute 'subBlocks' is required"})
  @Transform(({ value }) => JSON.parse(value))
  blocks: CategoryBlockDto[];

  @IsNotEmpty({message: "Attribute 'links' is required"})
  @Transform(({ value }) => JSON.parse(value))
  links: LinkBlockDto[];

  @IsNotEmpty({message: "Attribute 'subBlocks' is required"})
  @Transform(({ value }) => JSON.parse(value))
  subBlocks: SubBlockDto[];

}