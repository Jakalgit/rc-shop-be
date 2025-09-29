import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Image } from "../../image/models/image.model";

export interface CategoryBlockCreationAttrs {
  blockText: string;
  imageId: number;
  index: number;
}

@Table({tableName: 'category_blocks'})
export class CategoryBlock extends Model<CategoryBlock, CategoryBlockCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  blockText: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  imageId: number;
}