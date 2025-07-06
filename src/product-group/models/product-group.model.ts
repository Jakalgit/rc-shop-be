import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Product } from "../../product/models/product.model";

export interface ProductGroupCreationAttrs {
  name: string;
}

@Table({ tableName: 'product_groups' })
export class ProductGroup extends Model<ProductGroup, ProductGroupCreationAttrs>{

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  name: string;

  @HasMany(() => Product)
  products: Product[];
}