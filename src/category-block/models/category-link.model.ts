import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { CategoryBlock } from "./category-block.model";

export interface CategoryLinkCreationAttrs {
  linkText: string;
  link: string;
  categoryBlockId: number;
  index: number;
}

@Table({ tableName: 'category_links' })
export class CategoryLink extends Model<CategoryLink, CategoryLinkCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  linkText: string;

  @Column({ type: DataType.STRING, allowNull: false })
  link: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @BelongsTo(() => CategoryBlock)
  categoryBlocks: CategoryBlock[];

  @ForeignKey(() => CategoryBlock)
  @Column({type: DataType.INTEGER, allowNull: false, onDelete: "CASCADE" })
  categoryBlockId: number;
}