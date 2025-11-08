import { IsString } from "class-validator";

export class UpdateContactDto {

  @IsString()
  email: string;

  @IsString()
  address: string;

  @IsString()
  phone1: string;

  @IsString()
  phone2: string;

  @IsString()
  tgIdentifier: string;

  @IsString()
  whatsappIdentifier: string;

  @IsString()
  workTime: string;
}