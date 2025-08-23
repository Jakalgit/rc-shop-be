import { IsEmail } from "class-validator";

export class ResetPasswordEmailDto {

  @IsEmail({}, {message: "Wrong format for email address"})
  email: string;
}