import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Tag } from "./tag.model";

export interface GroupCreationAttrs {
  name: string;
}

@Table({ tableName: 'groups' })
export class Group extends Model<Group, GroupCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  name: string;

  @HasMany(() => Tag)
  tags: Tag[];
}