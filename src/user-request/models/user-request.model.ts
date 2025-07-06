import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface UserRequestCreationAttrs {
  name: string;
  phone: string;
  text?: string;
}

@Table({ tableName: 'user_requests' })
export class UserRequest extends Model<UserRequest, UserRequestCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone: string;

  @Column({ type: DataType.TEXT })
  text: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  checked: boolean;
}