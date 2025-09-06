import { BelongsTo, Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { OrderActionEnum } from "../../enums/order/order-action.enum";
import { OrderActionActorEnum } from "../../enums/order/order-action-actor.enum";
import { Order } from "./order.model";

export interface OrderActionCreationAttrs {
  actionType: OrderActionEnum;
  oldValue?: string;
  newValue?: string;
  actorType: OrderActionActorEnum;
  userAgent?: string;
  ipAddress?: string;
  comment: string;
  orderId: string;
}

@Table({ tableName: "order_actions" })
export class OrderAction extends Model<OrderAction, OrderActionCreationAttrs> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.ENUM(...Object.values(OrderActionEnum)), allowNull: false })
  actionType: OrderActionEnum;

  @Column({ type: DataType.TEXT })
  oldValue: string;

  @Column({ type: DataType.TEXT })
  newValue: string;

  @Column({ type: DataType.ENUM(...Object.values(OrderActionActorEnum)), allowNull: false })
  actorType: OrderActionActorEnum;

  @Column({ type: DataType.TEXT })
  userAgent: string;

  @Column({ type: DataType.STRING })
  ipAddress: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  comment: string;

  @BelongsTo(() => Order, {onDelete: "CASCADE"})
  order: Order;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;
}