import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChatDto } from '../dto/create-chat.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Chat } from '../models/chat.model';
import { ChatMessage } from '../models/chat-message.model';
import { SendMessageDto } from '../dto/send-message.dto';
import { SupportChatGateway } from "../support-chat.gateway";
import { Op } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { TelegramService } from "../../telegram/services/telegram.service";

@Injectable()
export class SupportChatService {
  constructor(
    @InjectModel(Chat)
    private readonly chatRepository: typeof Chat,
    @InjectModel(ChatMessage)
    private readonly chatMessageRepository: typeof ChatMessage,
    private readonly supportChatGateway: SupportChatGateway,
    private readonly sequelize: Sequelize,
    private readonly telegramService: TelegramService,
  ) {}

  async createChat(dto: CreateChatDto) {
    try {
      return await this.getChat(dto.clientId);
    } catch {
      return await this.chatRepository.create(dto);
    }
  }

  async sendMessage(dto: SendMessageDto, fromUser: boolean) {
    const chat = await this.getChat(dto.clientId);

    const transaction = await this.sequelize.transaction();
    const messageText = dto.message.trim();

    try {
      const message = await this.chatMessageRepository.create({
        ...dto,
        message: messageText,
        fromUser,
        chatId: chat.id,
      }, { transaction });
      
      if (fromUser) {
        await this.chatRepository.update(
          {lastClientMessageTime: Date.now()},
          {where: {clientId: dto.clientId}, transaction},
        );
      }

      await transaction.commit();

      this.supportChatGateway.sendToParticipants(dto.clientId, message);
    } catch (e) {
      await transaction.rollback();
      throw e;
    }

    if (fromUser) {
      this.sendTelegramNotification(chat, messageText);
    }
  }

  async getChat(clientId: string) {
    const chat = await this.chatRepository.findOne({
      where: { clientId },
      raw: true,
    });

    if (!chat) {
      throw new NotFoundException('Chat with such clientId not found');
    }

    return chat;
  }

  async getChatMessages(clientId: string) {
    const chat = await this.getChat(clientId);

    return await this.chatMessageRepository.findAll({
      where: {
        chatId: chat.id,
      },
      attributes: ['message', 'fromUser'],
      order: [['createdAt', 'ASC']],
      raw: true,
    });
  }

  async getChats(page: number, pageCount: number) {
    const chats = await this.chatRepository.findAndCountAll({
      limit: pageCount,
      offset: (page - 1) * pageCount,
      order: [['lastClientMessageTime', 'DESC']],
      raw: true,
    })

    const messages = await this.chatMessageRepository.findAll({
      attributes: ['id', 'chatId', 'message', 'fromUser', 'createdAt'],
      where: {
        chatId: {
          [Op.in]: chats.rows.map(chat => chat.id),
        },
      },
      order: [['chatId', 'ASC'], ['createdAt', 'DESC']],
      raw: true,
    });

    // оставляем только первую (самую свежую) запись на каждый chatId
    const lastMessageByChat: ChatMessage[] = Object.values(
      messages.reduce((acc, msg) => {
        if (!acc[msg.chatId]) acc[msg.chatId] = msg;
        return acc;
      }, {})
    );

    // Общее количество записей
    const totalRecords = chats.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / pageCount);

    const records = chats.rows.map(chat => {
      const message = lastMessageByChat
        .find(el => el.chatId === chat.id);

      return {
        ...chat,
        lastMessage: message,
      }
    });

    return {
      totalPages,
      records,
    }
  }

  private async sendTelegramNotification(chat: Chat, message: string) {
    await this.telegramService.sendSupportChatMessage({
      chatId: chat.clientId,
      clientName: chat.name,
      message,
    });
  }
}
