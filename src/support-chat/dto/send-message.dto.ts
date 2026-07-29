import { IsNotEmpty, MaxLength, Min, MinLength } from "class-validator";

export class SendMessageDto {

  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  @MinLength(1, {message: 'Минимальная длина сообщения - 1 символ'})
  @MaxLength(4096, {message: 'Максимальная длина сообщения - 4096 символов'})
  message: string;
}