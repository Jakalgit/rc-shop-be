import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { UserRequest } from "./models/user-request.model";
import { CreateRequestDto } from "./dto/create-request.dto";

@Injectable()
export class UserRequestService {

  constructor(
    @InjectModel(UserRequest)
    private readonly userRequestRepository: typeof UserRequest,
  ) {
  }

  async create(dto: CreateRequestDto) {
    const isValid = /^\+7\d{10}$/.test(dto.phone);

    if (!isValid) {
      throw new BadRequestException("Неверный формат номера телефона");
    }

    await this.userRequestRepository.create(dto);
  }

  async setChecked(id: number) {
    const request = await this.userRequestRepository.findOne({
      where: {id}
    });

    if (!request) {
      throw new NotFoundException("Ошибка, запроса не существует в базе данных");
    }

    await request.update({
      checked: true,
    });
  }

  async getUserRequests(limit: number, page: number) {
    const result = await this.userRequestRepository.findAndCountAll({
      limit,
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    // Общее количество записей
    const totalRecords = result.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / limit);

    // Полученные записи
    const records = result.rows;
    
    return {
      records,
      totalPages,
    }
  }
}
