import { IsEmail, IsNotEmpty } from "class-validator";

export class RequestEmailUpdateDto {

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}