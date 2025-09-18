import { IsEnum, IsNotEmpty } from "class-validator";
import { PageEnum } from "../enums/page-type.enum";

export class UpdatePageBlockDto {

  @IsNotEmpty({message: "Поле blocks не может быть пустым"})
  blocks: {
    title: string;
    description: string;
  }[]

  @IsNotEmpty({message: "Поле pageType не может быть пустым"})
  @IsEnum(PageEnum)
  pageType: PageEnum;
}