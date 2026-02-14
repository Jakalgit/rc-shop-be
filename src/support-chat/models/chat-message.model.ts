import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Chat } from "./chat.model";

interface ChatMessageCreationAttrs {
  message: string;
  fromUser: boolean;
  chatId: string;
}

@Table({ tableName: 'chat_messages' })
export class ChatMessage extends Model<ChatMessage, ChatMessageCreationAttrs> {

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, field: 'from_user' })
  fromUser: boolean;

  @BelongsTo(() => Chat)
  chat: Chat;

  @ForeignKey(() => Chat)
  @Column({ type: DataType.UUID, allowNull: false })
  chatId: string;
}