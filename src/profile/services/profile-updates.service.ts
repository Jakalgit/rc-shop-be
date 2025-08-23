import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Profile } from "../models/profile.model";
import { ProfileStatusEnum } from "../../enums/profile-status.enum";
import * as generatePassword from "generate-password";
import * as bcrypt from "bcrypt";
import { UpdatePasswordDto } from "../dto/update-password.dto";
import { MailerService } from "../../mailer/mailer.service";

@Injectable()
export class ProfileUpdatesService {

  constructor(
    @InjectModel(Profile)
    private readonly profileRepository: typeof Profile,
    private readonly mailerService: MailerService,
  ) {}

  async updatePartnerProfileStatus(
    id: string,
    status:
      | ProfileStatusEnum.ACTIVE
      | ProfileStatusEnum.REJECTED
      | ProfileStatusEnum.BANNED,
  ) {
    const profile = await this.profileRepository.findByPk(id, { raw: true });

    if (!profile) {
      throw new BadRequestException("Профиль с таким id не существует");
    }

    if (profile.status === status) {
      return {
        ok: true,
      };
    }

    switch (status) {
      case ProfileStatusEnum.ACTIVE:
        const password = generatePassword.generate({
          length: 15,
          numbers: true,
          symbols: false,
          uppercase: true,
          strict: true,
        });

        await this.mailerService.sendMail({
          to: profile.email,
          subject: 'Аккаунт партнёра зарегистрирован',
          template: 'partner-welcome',
          context: {
            name: profile.name,
            email: profile.email,
            password: password,
            shopName: "WORK-RC",
          }
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.profileRepository.update(
          { password: hashedPassword, status: ProfileStatusEnum.ACTIVE },
          {
            where: { id },
          },
        );
        break;
      case ProfileStatusEnum.REJECTED:
      case ProfileStatusEnum.BANNED:
        await this.profileRepository.update({ status }, { where: { id } });
        break;
      default:
        break;
    }
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    const profile = await this.profileRepository.findOne({
      where: {id},
      raw: true
    });

    if (!profile) {
      throw new NotFoundException(
        "Профиль не найден, попробуйте повторить запрос позже",
      );
    }

    if (!await bcrypt.compare(dto.oldPassword, profile.password)) {
      throw new BadRequestException("Неверный пароль");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.profileRepository.update({password: hashedPassword}, {where: {id: profile.id}});
  }

  async deleteProfile(id: string) {
    const profile = await this.profileRepository.findByPk(id);

    if (profile.status === ProfileStatusEnum.ACTIVE) {
      throw new BadRequestException("Невозможно удалить активный профиль");
    }

    await this.profileRepository.destroy({ where: { id } });
  }
}