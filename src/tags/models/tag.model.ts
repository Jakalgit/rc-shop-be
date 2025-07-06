import { BelongsTo, BelongsToMany, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Product } from "../../product/models/product.model";
import { TagProduct } from "./tag-product.model";
import { Group } from "./group.model";

export interface TagCreationAttrs {
  name: string;
  groupId?: number;
}

@Table({ tableName: 'tags' })
export class Tag extends Model<Tag, TagCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name: string;

  @ForeignKey(() => Group)
  @Column({ type: DataType.INTEGER, allowNull: true, onDelete: "SET NULL" })
  groupId: number;

  @BelongsTo(() => Group)
  group: Group;

  @BelongsToMany(() => Product, () => TagProduct)
  products: Product[];
}