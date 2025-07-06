import { BelongsTo, Column, DataType, ForeignKey, Index, Model, Table } from "sequelize-typescript";
import { Product } from "./product.model";

export interface DescriptionCreationAttrs {
  index: number;
  text: string;
  productId: number;
}

@Table({ tableName: "descriptions" })
export class Description extends Model<Description, DescriptionCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Index({ name: 'unique_index_per_product', unique: true })
  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  text: string;

  @BelongsTo(() => Product)
  product: Product;

  @Index({ name: 'unique_index_per_product', unique: true })
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  productId: number;

}