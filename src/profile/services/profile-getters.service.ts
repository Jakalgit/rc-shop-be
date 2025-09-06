import { Injectable, NotFoundException } from "@nestjs/common";
import { ProfileStatusEnum } from "../../enums/profile-status.enum";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "../models/profile.model";

@Injectable()
export class ProfileGettersService {

  constructor(
    @InjectModel(Profile)
    private readonly profileRepository: typeof Profile,
  ) {
  }

  async getProfile(id: string) {
    const profile = await this.profileRepository.findOne({
      where: {id},
      raw: true,
      attributes: { exclude: ['password'] }
    });

    if (!profile) {
      throw new NotFoundException("Профиль не существует");
    }

    return profile;
  }

  async getPartnerProfiles(
    {
      page = 1,
      limit = 1,
      status,
    }: {
      page?: number;
      limit?: number;
      status?: ProfileStatusEnum;
    }
  ) {
    const result = await this.profileRepository.findAndCountAll({
      where: { status },
      attributes: { exclude: ['password', 'type'] },
      limit,
      offset: (page - 1) * limit,
    });

    // Общее количество записей
    const totalRecords = result.count;

    // Общее количество страниц
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      records: result.rows,
      totalPages,
    };
  }
}