import { IsNotEmpty } from "class-validator";

export class LoginAdminDto {

  @IsNotEmpty()
  login: string;

  @IsNotEmpty()
  password: string;
}