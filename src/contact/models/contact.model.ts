import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface ContactCreationAttrs {
  email: string;
  address: string;
  phone: string;
  tgIdentifier: string;
  whatsappIdentifier: string;
  workTime: string;
}

@Table({ tableName: "contacts" })
export class Contact extends Model<Contact, ContactCreationAttrs> {

  @Column({ type: DataType.STRING })
  email: string;

  @Column({ type: DataType.STRING })
  address: string;

  @Column({ type: DataType.STRING })
  phone: string;

  @Column({ type: DataType.STRING })
  tgIdentifier: string;

  @Column({ type: DataType.STRING })
  whatsappIdentifier: string;

  @Column({ type: DataType.TEXT })
  workTime: string;
}