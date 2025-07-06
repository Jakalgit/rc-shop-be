import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface RepairServiceCreationAttrs {
  service: string;
  price: string;
}

@Table({ tableName: 'repair_services' })
export class RepairService extends Model<RepairService, RepairServiceCreationAttrs> {

  @Column({ type: DataType.TEXT, allowNull: false, unique: true })
  service: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  price: string;
}