import { DeliveryMethodEnum } from "../../enums/order/delivery-method.enum";
import { DeliveryStatusEnum } from "../../enums/order/delivery-status.enum";
import { PaymentMethodEnum } from "../../enums/order/payment-method.enum";
import { PaymentStatusEnum } from "../../enums/order/payment-status.enum";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber } from "class-validator";
import { OrderStatusEnum } from "../../enums/order/order-status.enum";

export class UpdateOrderDto {

  @IsNotEmpty()
  orderNumber: string;

  @IsOptional()
  guestName?: string;

  @IsOptional()
  @IsPhoneNumber('RU', {message: "Неверный формат номера телефона"})
  guestPhone?: string;

  @IsOptional()
  @IsEmail({}, {message: "Неверный формат E-Mail"})
  guestEmail?: string;

  @IsOptional()
  address?: string;

  @IsNotEmpty()
  @IsEnum(DeliveryMethodEnum)
  deliveryMethod: DeliveryMethodEnum;

  @IsOptional()
  deliveryPrice?: number;

  @IsOptional()
  deliveredAt?: string;

  @IsOptional()
  @IsEnum(DeliveryStatusEnum)
  deliveryStatus?: DeliveryStatusEnum;

  @IsOptional()
  trackingNumber?: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  paymentMethod?: PaymentMethodEnum;

  @IsOptional()
  discount?: number;

  @IsOptional()
  paidAt?: string;

  @IsOptional()
  @IsEnum(PaymentStatusEnum)
  paymentStatus?: PaymentStatusEnum;

  @IsOptional()
  @IsEnum(OrderStatusEnum)
  status?: OrderStatusEnum;

  @IsOptional()
  transactionId?: string;

  @IsOptional()
  comment?: string;

  @IsOptional()
  systemComment?: string;

  @IsOptional()
  profileId?: string;

  @IsNotEmpty()
  actionComment: string;
}