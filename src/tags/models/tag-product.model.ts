import { Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { Product } from "../../product/models/product.model";
import { Tag } from "./tag.model";

export interface TagProductCreationAttrs {
  tagId: number;
  productId: number;
}

@Table({ tableName: "tag-product" })
export class TagProduct extends Model<TagProduct, TagProductCreationAttrs> {

  @ForeignKey(() => Product)
  @Column({onDelete: "CASCADE"})
  productId: number;

  @ForeignKey(() => Tag)
  @Column({onDelete: "CASCADE"})
  tagId: number;
}