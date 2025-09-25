import { IsString } from "class-validator";

export class UpdateContactDto {

  @IsString()
  email: string;

  @IsString()
  address: string;

  @IsString()
  phone: string;

  @IsString()
  tgIdentifier: string;

  @IsString()
  whatsappIdentifier: string;

  @IsString()
  workTime: string;
}