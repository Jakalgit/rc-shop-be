import {
  BeforeSave,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table
} from "sequelize-typescript";
import { Detail } from "./detail.model";
import { Preview } from "./preview.model";
import { Tag } from "../../tags/models/tag.model";
import { TagProduct } from "../../tags/models/tag-product.model";
import { ProductGroup } from "../../product-group/models/product-group.model";
import { OrderItem } from "../../order/models/order_item.model";

export interface ProductCreationAttrs {
  name: string;
  availability: boolean;
  visibility: boolean;
  price: number;
  wholesalePrice: number;
  count: number;
  article: string;
  oldPrice?: number;
  promotionPercentage?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  partsUrl?: string;
  tuningUrl?: string;
  productGroupId?: number;
}

@Table({ tableName: "products" })
export class Product extends Model<Product, ProductCreationAttrs> {

  @Column({ type: DataType.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true })
  id: number;

  // Название товар
  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  // Наличие товара
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  availability: boolean;

  // Видимость товара пользователю
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  visibility: boolean;

  // Артикул
  @Column({ type: DataType.STRING, allowNull: false })
  article: string;

  // Кол-во
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  count: number;

  // Розничная цена товара
  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  // Оптовая цена товара
  @Column({ type: DataType.FLOAT, allowNull: false })
  wholesalePrice: number;

  // Старая цена товара (если хотим добавить скидку)
  @Column({ type: DataType.FLOAT })
  oldPrice: number;

  // Проценты скидки
  @Column({ type: DataType.FLOAT })
  promotionPercentage: number;

  // Ссылка на страницу с запчастями
  @Column({ type: DataType.TEXT })
  partsUrl: string;

  // Ссылка на страницу с тюнингом
  @Column({ type: DataType.TEXT })
  tuningUrl: string;

  // Вес коробки
  @Column({ type: DataType.FLOAT })
  weight: number;

  // Размеры товара

  @Column({ type: DataType.FLOAT })
  width: number;

  @Column({ type: DataType.FLOAT })
  height: number;

  @Column({ type: DataType.FLOAT })
  length: number;

  @ForeignKey(() => ProductGroup)
  @Column({ type: DataType.INTEGER.UNSIGNED, onDelete: "SET NULL" })
  productGroupId: number;

  @HasMany(() => Detail)
  descriptions: Detail[];

  @HasMany(() => Preview)
  previews: Preview[];

  @HasMany(() => OrderItem)
  orderItems: OrderItem[];

  @BelongsToMany(() => Tag, () => TagProduct)
  tags: Tag[];

  @BelongsTo(() => ProductGroup)
  productGroup: ProductGroup;

  @BeforeSave
  static checkAvailability(instance: Product) {
    instance.availability = instance.count !== 0;
  }
}