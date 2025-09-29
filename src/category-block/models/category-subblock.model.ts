import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { CategoryBlock } from "./category-block.model";
import { Image } from "../../image/models/image.model";

export interface CategorySubBlockCreationAttrs {
  blockLink: string;
  name: string;
  categoryBlockId: number;
  imageId: number;
  index: number;
}

@Table({ tableName: 'category_sub_blocks' })
export class CategorySubBlock extends Model<CategorySubBlock, CategorySubBlockCreationAttrs> {

  @Column({type: DataType.STRING, allowNull: false})
  blockLink: string;

  @Column({type: DataType.STRING, allowNull: false})
  name: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @BelongsTo(() => CategoryBlock)
  categoryBlocks: CategoryBlock[];

  @ForeignKey(() => CategoryBlock)
  @Column({type: DataType.INTEGER, allowNull: false, onDelete: "CASCADE" })
  categoryBlockId: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  imageId: number;
}