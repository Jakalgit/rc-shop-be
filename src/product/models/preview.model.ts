import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Product } from "./product.model";
import { Image } from "../../image/models/image.model";

export interface PreviewCreationAttrs {
  index: number;
  productId: number;
  imageId: number;
}

@Table({ tableName: 'previews' })
export class Preview extends Model<Preview, PreviewCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  // @Index({ name: 'unique_preview_index_per_product', unique: true })
  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @BelongsTo(() => Image)
  image: Image;

  @BelongsTo(() => Product)
  product: Product;

  // @Index({ name: 'unique_preview_index_per_product', unique: true })
  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "CASCADE" })
  productId: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, onDelete: "CASCADE" })
  imageId: number;
}