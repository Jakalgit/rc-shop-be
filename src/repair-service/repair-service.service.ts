import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { RepairService } from "./models/repair-service";
import { UpdateServiceDto } from "./dto/update-services.dto";
import { Sequelize } from "sequelize-typescript";

@Injectable()
export class RepairService_Service {

  constructor(
    @InjectModel(RepairService)
    private readonly repairService: typeof RepairService,
    private readonly sequelize: Sequelize
  ) {
  }

  async setNew(dto: UpdateServiceDto) {
    if (dto.items.find(el => el.service.length < 1 || el.price.length < 1)) {
      throw new BadRequestException("Строки должны содержать как минимум 1 символ");
    }

    const transaction = await this.sequelize.transaction();

    try {
      await this.repairService.destroy({truncate: true, transaction});

      const result = await this.repairService.bulkCreate(dto.items, {transaction});

      await transaction.commit();

      return result;
    } catch (e) {
      console.error(e);
      await transaction.rollback();
      throw e;
    }
  }

  async getServices() {
    return await this.repairService.findAll({raw: true});
  }
}
