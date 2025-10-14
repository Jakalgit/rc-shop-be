import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Image } from "../../image/models/image.model";

export interface SliderItemCreationAttrs {
  href: string;
  title: string;
  text: string;
  buttonText: string;
  imageId: number;
  index: number;
}

@Table({ tableName: 'slider_items' })
export class SliderItem extends Model<SliderItem, SliderItemCreationAttrs> {

  @Column({ type: DataType.TEXT, allowNull: false })
  href: string;

  @Column({ type: DataType.STRING, allowNull: false })
  title: string;

  @Column({ type: DataType.STRING, allowNull: false })
  text: string;

  @Column({ type: DataType.STRING, allowNull: false })
  buttonText: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  index: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER, allowNull: false })
  imageId: number;

  @BelongsTo(() => Image)
  image: Image;
}