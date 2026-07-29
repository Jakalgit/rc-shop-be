import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface ChatCreationAttrs {
  name: string;
  clientId: string;
}

@Table({ tableName: 'chats' })
export class Chat extends Model<Chat, ChatCreationAttrs> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false, field: 'client_id' })
  clientId: string;

  @Column({ type: DataType.BIGINT, field: 'last_client_message_time' })
  lastClientMessageTime: number;
}