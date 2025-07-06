import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ContactService } from "./contact.service";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller('contact')
export class ContactController {

  constructor(
    private readonly contactService: ContactService,
  ) {
  }

  // Изменить контактные данные
  @UseGuards(JwtAuthGuard)
  @Put()
  async update(@Body() dto: UpdateContactDto) {
    return await this.contactService.updateContactData(dto);
  }

  // Получить контактные данные
  @Get()
  async getOne() {
    return await this.contactService.getContactData();
  }
}
