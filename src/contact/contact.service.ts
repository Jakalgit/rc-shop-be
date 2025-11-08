import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Contact } from "./models/contact.model";
import { UpdateContactDto } from "./dto/update-contact.dto";

@Injectable()
export class ContactService implements OnModuleInit{

  constructor(
    @InjectModel(Contact)
    private readonly contactRepository: typeof Contact,
  ) {
  }

  async onModuleInit(): Promise<void> {
    // Инициализируем модель при запуске сервера
    await this.initialize();
  }

  async initialize(): Promise<void> {
    const items = await this.contactRepository.findAll({ raw: true });
    // Если таблица пуста, то создаем по дефолту 1 запись
    if (!items.length) {
      await this.contactRepository.create({
        email: "",
        address: "",
        tgIdentifier: "",
        whatsappIdentifier: "",
        workTime: ""
      });
    }
  }

  async updateContactData(dto: UpdateContactDto): Promise<void> {
    const contact = await this.contactRepository.findOne();

    if (contact) {
      await contact.update(dto);
    }
  }

  async getContactData(): Promise<Contact> {
    return await this.contactRepository.findOne({ raw: true });
  }
}
