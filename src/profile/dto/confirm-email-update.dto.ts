import { IsNotEmpty } from "class-validator";

export class ConfirmedEmailUpdateDto {

  @IsNotEmpty()
  token: string;
}