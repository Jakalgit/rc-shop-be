import { IsNotEmpty, MinLength } from "class-validator";

export class UpdatePasswordDto {

  @IsNotEmpty({message: "Old password cannot be empty"})
  oldPassword: string;

  @IsNotEmpty({message: "New password cannot be empty"})
  @MinLength(10, {message: "Minimum password length: 8 characters"})
  newPassword: string;
}