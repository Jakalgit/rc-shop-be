import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsOptional, IsPhoneNumber, IsString } from "class-validator";
import { DeliveryMethodEnum } from "../../../enums/order/delivery-method.enum";
import { PaymentMethodEnum } from "../../../enums/order/payment-method.enum";
import {
  CdekMetadataType,
} from "../types";

export class CreateOrderDto {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  surname: string;

  @IsOptional()
  @IsString()
  patronymic: string;

  @IsNotEmpty()
  @IsPhoneNumber("RU")
  phone: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(DeliveryMethodEnum)
  deliveryMethod: DeliveryMethodEnum;

  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  comment: string;

  @IsOptional()
  @IsObject()
  cdekMetadata?: CdekMetadataType;

  @IsNotEmpty()
  items: {article: string, qty: number}[];
}