import { IsNotEmpty, IsOptional, IsPhoneNumber, Length, MinLength } from "class-validator";

export class CreateRequestDto {

  @IsNotEmpty({message: "name required"})
  @Length(2, 50, { message: "Name length: 2 - 50 symbols" })
  name: string;

  @IsNotEmpty({})
  @IsPhoneNumber('RU', {message: "Phone number isn't valid"})
  phone: string;

  @MinLength(2)
  @IsOptional()
  text?: string;
}