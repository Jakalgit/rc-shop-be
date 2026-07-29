import { Injectable } from '@nestjs/common';
import { Markup, Telegraf } from "telegraf";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramService {
  private ordersBot: Telegraf;
  private chatBot: Telegraf;
  private readonly ADMIN_HOST: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.ordersBot = new Telegraf(configService.get<string>('ORDERS_BOT_TOKEN'));
    this.chatBot = new Telegraf(configService.get<string>('CHAT_BOT_TOKEN'));
    this.ADMIN_HOST = configService.get<string>('ADMIN_HOST');
  }

  async sendNewOrderMessage(
    {clientName, orderNumber, subtotal}: {clientName: string, orderNumber: string, subtotal: number},
  ): Promise<void> {
    const text = `<b>Новый заказ!</b> От пользователя ${clientName}
<b>Номер заказа:</b> ${orderNumber}
<b>Сумма заказа:</b> ${subtotal} ₽
    `

    await this.sendToHolders(this.ordersBot, text);
  }

  async sendSupportChatMessage(
    { chatId, clientName, message }: { chatId: string; clientName: string; message: string },
  ): Promise<void> {
    const text = `<b>Новое сообщение в поддержку!</b>
<b>От:</b> ${clientName}
<b>Сообщение:</b> ${message}`;

    const chatUrl = `${this.ADMIN_HOST}/chat-tg/${chatId}`;
    const replyMarkup = Markup.inlineKeyboard([
      Markup.button.webApp('Открыть чат', chatUrl),
    ]);

    await this.sendToHolders(this.chatBot, text, replyMarkup);
  }

  private async sendToHolders(bot: Telegraf, text: string, extra?: object): Promise<void> {
    const consumers: number[] = JSON.parse(this.configService.get('HOLDERS_PEER_IDS'));
    const promises: Promise<any>[] = [];

    for (const consumer of consumers) {
      try {
        promises.push(
          bot.telegram.sendMessage(
            consumer,
            text,
            { parse_mode: 'HTML', ...extra },
          ),
        );
      } catch {}
    }

    await Promise.all(promises);
  }
}
