import { IsString } from "class-validator";

export class UpdateContactDto {

  @IsString()
  email: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;
}