import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Order } from "./order.model";
import { Product } from "../../product/models/product.model";

export interface OrderItemCreationAttrs {
  name: string;
  price: number;
  quantity: number;
  article: string;
  orderId: string;
  productId?: number;
}

@Table({ tableName: "order_items" })
export class OrderItem extends Model<OrderItem, OrderItemCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  quantity: number;

  @Column({ type: DataType.STRING, allowNull: false })
  article: string;

  @BelongsTo(() => Order, { onDelete: "CASCADE" })
  order: Order;

  @ForeignKey(() => Order)
  @Column({ type: DataType.UUID, allowNull: false })
  orderId: string;

  @BelongsTo(() => Product, { onDelete: "SET NULL" })
  product: Product;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER })
  productId: number;
}