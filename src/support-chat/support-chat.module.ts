import { Module } from '@nestjs/common';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatService } from './services/support-chat.service';
import { AuthModule } from "../auth/auth.module";
import { SequelizeModule } from "@nestjs/sequelize";
import { Chat } from "./models/chat.model";
import { ChatMessage } from "./models/chat-message.model";
import { SupportChatGateway } from "./support-chat.gateway";

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Chat, ChatMessage]),
  ],
  controllers: [SupportChatController],
  providers: [SupportChatService, SupportChatGateway],
})
export class SupportChatModule {}
