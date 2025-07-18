import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Image } from "../../image/models/image.model";

export interface SliderItemCreationAttrs {
  href: string;
  imageId: number;
  index: number;
}

@Table({ tableName: 'slider_items' })
export class SliderItem extends Model<SliderItem, SliderItemCreationAttrs> {

  @Column({ type: DataType.TEXT, allowNull: false })
  href: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER, allowNull: false })
  imageId: number;

  @BelongsTo(() => Image)
  image: Image;
}