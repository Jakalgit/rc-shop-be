import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Preview } from "../../product/models/preview.model";

export interface ImageCreationAttrs {
  filename: string;
}

@Table({ tableName: 'images' })
export class Image extends Model<Image, ImageCreationAttrs> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  filename: string;

  @HasMany(() => Preview)
  previews: Preview[];
}