import { Column, DataType, Model, Table } from "sequelize-typescript";
import { PageEnum } from "../enums/page-type.enum";

interface PageBlockCreationAttrs {
  title: string;
  description: string;
  pageType: PageEnum;
}

@Table({ tableName: 'page-blocks' })
export class PageBlock extends Model<PageBlock, PageBlockCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description: string;

  @Column({ type: DataType.ENUM(...Object.values(PageEnum)), allowNull: false })
  pageType: PageEnum;
}