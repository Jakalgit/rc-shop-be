import { IsNotEmpty } from "class-validator";

export class LoginProfileDto {

  @IsNotEmpty()
  login: string;

  @IsNotEmpty()
  password: string;
}