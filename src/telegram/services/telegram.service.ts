import { Injectable } from '@nestjs/common';
import { Telegraf } from "telegraf";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramService {
  private bot: Telegraf;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.bot = new Telegraf(configService.get<string>('ORDERS_BOT_TOKEN'));
  }

  async sendNewOrderMessage(
    {clientName, orderNumber, subtotal}: {clientName: string, orderNumber: string, subtotal: number},
  ): Promise<void> {
    const text = `<b>Новый заказ!</b> От пользователя ${clientName}
<b>Номер заказа:</b> ${orderNumber}
<b>Сумма заказа:</b> ${subtotal} ₽
    `

    const consumers: number[] = JSON.parse(this.configService.get('HOLDERS_PEER_IDS'))

    const promises: Promise<any>[] = [];

    for (const consumer of consumers) {
      try {
        promises.push(
          this.bot.telegram.sendMessage(
            consumer,
            text,
            { parse_mode: 'HTML'}
          )
        )
      } catch {}
    }

    await Promise.all(promises);
  }
}
