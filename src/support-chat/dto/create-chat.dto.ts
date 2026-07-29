import { IsNotEmpty, Min, MinLength } from "class-validator";

export class CreateChatDto {

  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  @MinLength(2, {message: 'Длина имени должна быть не менее 2ух символов'})
  name: string;
}