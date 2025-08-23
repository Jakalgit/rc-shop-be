import { IsNotEmpty, MinLength } from "class-validator";

export class ConfirmResetDto {

  @IsNotEmpty()
  token: string;

  @IsNotEmpty({message: "New password cannot be empty"})
  @MinLength(10, {message: "Minimum password length: 8 characters"})
  password: string;
}