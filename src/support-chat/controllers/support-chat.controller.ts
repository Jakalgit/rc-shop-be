import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CreateChatDto } from "../dto/create-chat.dto";
import { SendMessageDto } from "../dto/send-message.dto";
import { SupportChatService } from "../services/support-chat.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

@Controller('support-chat')
export class SupportChatController {

  constructor(
    private readonly supportChatService: SupportChatService,
  ) {
  }

  @Post()
  createChat(@Body() dto: CreateChatDto) {
    return this.supportChatService.createChat(dto);
  }

  @Post('/send')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.supportChatService.sendMessage(dto, true);
  }

  @UseGuards(AdminAuthGuard)
  @Post('/send-ad')
  sendAdminMessage(@Body() dto: SendMessageDto) {
    return this.supportChatService.sendMessage(dto, false);
  }

  @Get('/info/:clientId')
  getChatInfoByClientId(@Param('clientId') clientId: string) {
    return this.supportChatService.getChat(clientId);
  }

  @Get('/messages/:clientId')
  getChatMessagesByClientId(@Param('clientId') clientId: string) {
    return this.supportChatService.getChatMessages(clientId);
  }

  @UseGuards(AdminAuthGuard)
  @Get('/chats')
  getChats(
    @Query('page') page: number = 1,
    @Query('pageCount') pageCount: number = 12,
  ) {
    return this.supportChatService.getChats(page, pageCount);
  }
}
