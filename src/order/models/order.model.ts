import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import { DeliveryMethodEnum } from "../../enums/order/delivery-method.enum";
import { DeliveryStatusEnum } from "../../enums/order/delivery-status.enum";
import { PaymentMethodEnum } from "../../enums/order/payment-method.enum";
import { PaymentStatusEnum } from "../../enums/order/payment-status.enum";
import { Profile } from "../../profile/models/profile.model";
import { OrderItem } from "./order_item.model";
import { OrderStatusEnum } from "../../enums/order/order-status.enum";

export interface OrderCreationAttrs {
  orderNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  address?: string;
  deliveryMethod: DeliveryMethodEnum;
  deliveryPrice?: number;
  deliveredAt?: string;
  deliveryStatus?: DeliveryStatusEnum;
  trackingNumber?: string;
  paymentMethod: PaymentMethodEnum;
  subtotal: number;
  discount?: number;
  paidAt?: string;
  paymentStatus?: PaymentStatusEnum;
  transactionId?: string;
  comment?: string;
  userAgent?: string;
  profileId?: string;
}

@Table({tableName: 'orders'})
export class Order extends Model<Order, OrderCreationAttrs> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  orderNumber: string;

  @Column({ type: DataType.STRING, allowNull: false })
  guestName: string;

  @Column({ type: DataType.STRING, allowNull: false })
  guestPhone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  guestEmail: string;

  @Column({ type: DataType.TEXT })
  address: string;

  @Column({ type: DataType.ENUM(...Object.values(DeliveryMethodEnum)), allowNull: false })
  deliveryMethod: DeliveryMethodEnum;

  @Column({ type: DataType.FLOAT })
  deliveryPrice: number;

  @Column({ type: DataType.DATE })
  deliveredAt: string;

  @Column({ type: DataType.ENUM(...Object.values(DeliveryStatusEnum)) })
  deliveryStatus: DeliveryStatusEnum;

  @Column({ type: DataType.STRING })
  trackingNumber: string;

  @Column({ type: DataType.ENUM(...Object.values(PaymentMethodEnum)), allowNull: false })
  paymentMethod: PaymentMethodEnum;

  @Column({ type: DataType.FLOAT, allowNull: false })
  subtotal: number;

  @Column({ type: DataType.FLOAT })
  discount: number;

  @Column({ type: DataType.DATE })
  paidAt: string;

  @Column({ type: DataType.ENUM(...Object.values(PaymentStatusEnum)) })
  paymentStatus: PaymentStatusEnum;

  @Column({type: DataType.STRING })
  transactionId: string;

  @Column({ type: DataType.TEXT })
  comment: string;

  @Column({ type: DataType.TEXT })
  systemComment: string;

  @Column({ type: DataType.ENUM(...Object.values(OrderStatusEnum)), allowNull: false, defaultValue: OrderStatusEnum.PENDING })
  status: OrderStatusEnum;

  @Column({ type: DataType.TEXT })
  userAgent: string;

  @Column({ type: DataType.STRING })
  ipAddress: string;

  @BelongsTo(() => Profile)
  profile: Profile;

  @ForeignKey(() => Profile)
  @Column({ type: DataType.UUID, onDelete: "SET NULL" })
  profileId: string;

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];
}