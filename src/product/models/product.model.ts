import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface ProductCreationAttrs {
  name: string;
  availability: boolean;
  visibility: boolean;
  price: number;
  oldPrice?: number;
  promotionPercents?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
}

@Table({ tableName: "products" })
export class Product extends Model<Product, ProductCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
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

  // Цена товара
  @Column({ type: DataType.FLOAT, allowNull: false })
  price: number;

  // Старая цена товара (если хотим добавить скидку)
  @Column({ type: DataType.FLOAT })
  oldPrice: number;

  // Проценты скидки
  @Column({ type: DataType.FLOAT })
  promotionPercents: number;

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
}