import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Product } from "./product.model";
import { DetailEnum } from "../../enums/detail.enum";

export interface DetailCreationAttrs {
  index: number;
  text: string;
  productId: number;
  detailType: DetailEnum;
}

@Table({ tableName: "details" })
export class Detail extends Model<Detail, DetailCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  // @Index({ name: 'unique_detail_index_per_product', unique: true })
  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  text: string;

  // @Index({ name: 'unique_detail_index_per_product', unique: true })
  @Column({ type: DataType.ENUM(...Object.values(DetailEnum)), allowNull: false })
  detailType: DetailEnum;

  @BelongsTo(() => Product)
  product: Product;

  // @Index({ name: 'unique_detail_index_per_product', unique: true })
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  productId: number;

}