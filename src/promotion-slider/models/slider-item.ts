import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Image } from "../../image/models/image.model";
import { SliderTagEnum } from "../enums/slider-tag.enum";

export interface SliderItemCreationAttrs {
  href: string;
  title: string;
  text: string;
  buttonText: string;
  tagType?: SliderTagEnum;
  price?: number;
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

  @Column({ type: DataType.ENUM(...Object.values(SliderTagEnum)), allowNull: false, defaultValue: SliderTagEnum.NONE })
  tagType: SliderTagEnum;

  @Column({ type: DataType.INTEGER, defaultValue: null })
  price: number;

  @ForeignKey(() => Image)
  @Column({ type: DataType.INTEGER, allowNull: false })
  imageId: number;

  @BelongsTo(() => Image)
  image: Image;
}