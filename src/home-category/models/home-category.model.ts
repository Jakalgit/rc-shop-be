import { Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Group } from "../../tags/models/group.model";
import { Image } from "../../image/models/image.model";

export interface HomeCategoryCreationAttrs {
  groupId: number;
  imageId: number;
}

@Table({ tableName: 'home_categories' })
export class HomeCategory extends Model<HomeCategory, HomeCategoryCreationAttrs> {

  @ForeignKey(() => Group)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false, unique: true })
  groupId: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER.UNSIGNED, allowNull: false })
  imageId: number;
}