import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Profile } from '../models/profile.model';
import { CreatePartnerDto } from '../dto/create-partner.dto';
import { Op } from 'sequelize';
import { ProfileStatusEnum } from '../../enums/profile-status.enum';
import { ProfileEnum } from '../../enums/profile.enum';
import { AuthService } from '../../auth/auth.service';
import { LoginProfileDto } from '../../auth/dto/login-profile.dto';
import { RequestEmailUpdateDto } from '../dto/request-email-update.dto';
import { RedisService } from '../../redis/redis.service';
import { randomUUID } from 'crypto';
import { ConfirmedEmailUpdateDto } from '../dto/confirm-email-update.dto';
import { MailerService } from "../../mailer/mailer.service";
import { ConfigService } from "@nestjs/config";
import { ResetPasswordEmailDto } from "../dto/reset-password/reset-password-email.dto";
import { ConfirmResetDto } from "../dto/reset-password/confirm-reset.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class ProfileService {
  private readonly EMAIL_UPDATE_PREFIX = 'email-update';
  private readonly RESET_PASSWORD_PREFIX = 'reset-password';
  private readonly MAIN_HOST: string;

  constructor(
    @InjectModel(Profile)
    private readonly profileRepository: typeof Profile,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.MAIN_HOST = configService.get<string>('MAIN_HOST');
  }

  async createPartner(dto: CreatePartnerDto) {
    const profileCandidate = await this.profileRepository.findOne({
      where: {
        [Op.or]: {
          phone: dto.phone,
          email: dto.email,
        },
        status: ProfileStatusEnum.ACTIVE,
      },
      raw: true,
    });

    if (profileCandidate) {
      throw new BadRequestException(
        "Профиль партнера с таким E-Mail или номером телефона уже существует",
      );
    }

    await this.profileRepository.create({
      ...dto,
      status: ProfileStatusEnum.PENDING,
      type: ProfileEnum.PARTNER,
    });

    return {
      ok: true,
    };
  }

  async login(dto: LoginProfileDto) {
    const profile = await this.profileRepository.findOne({
      where: {
        [Op.or]: {
          phone: dto.login,
          email: dto.login,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Неверный логин или пароль');
    }

    const jwt = await this.authService.loginProfile(dto, profile);

    return { jwt };
  }

  async requestEmailUpdate(id: string, dto: RequestEmailUpdateDto) {
    const [profilesWithSuchEmail, profile] = await Promise.all([
      this.profileRepository.findAll({
        where: {
          email: dto.email,
          status: ProfileStatusEnum.ACTIVE,
        },
        raw: true,
      }),
      this.profileRepository.findByPk(id, {raw: true}),
    ]);

    if (profilesWithSuchEmail.find((el) => el.id !== id)) {
      throw new ConflictException(
        'Пользователь с таким E-Mail уже существует, введите другой E-Mail',
      );
    }

    if (profilesWithSuchEmail.find((el) => el.id === id)) {
      throw new BadRequestException('Старый и новый E-Mail не должны совпадать');
    }

    const userKey = `${this.EMAIL_UPDATE_PREFIX}:user:${id}`;
    if (await this.redisService.exists(userKey)) {
      throw new HttpException(
        'Вы можете запрашивать смену E-Mail не чаще чем раз в 5 минут, запрос уже отправлен, проверьте почту',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const emailKey = `${this.EMAIL_UPDATE_PREFIX}:email:${dto.email}`;
    if (await this.redisService.exists(emailKey)) {
      throw new BadRequestException('Этот E-Mail сейчас используется другим пользователем');
    }

    const token = randomUUID();

    try {
      const payload = JSON.stringify({email: dto.email, id});

      await Promise.all([
        this.redisService.set(`${this.EMAIL_UPDATE_PREFIX}:token:${token}`, payload, 300),
        this.redisService.set(`${this.EMAIL_UPDATE_PREFIX}:user:${id}`, token, 300),
        this.redisService.set(`${this.EMAIL_UPDATE_PREFIX}:email:${dto.email}`, token, 300)
      ]);

      await this.mailerService.sendMail({
        to: dto.email,
        subject: 'Обновление E-Mail',
        template: 'update-email',
        context: {
          name: profile.name,
          newEmail: dto.email,
          oldEmail: profile.email,
          shopName: "WORK-RC",
          updateUrl: `${this.MAIN_HOST}/confirmation-update?token=${token}`
        }
      });
    } catch (error) {
      await Promise.all([
        this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:token:${token}`),
        this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:user:${id}`),
        this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:email:${dto.email}`)
      ]);
      throw error;
    }
  }

  async confirmEmailUpdate(dto: ConfirmedEmailUpdateDto) {
    const dataStr = await this.redisService.get(`${this.EMAIL_UPDATE_PREFIX}:token:${dto.token}`);
    if (!dataStr) {
      throw new BadRequestException(
        "Неизвестный номер запроса, попробуйте повторить запрос заново",
      );
    }

    const { email, id } = JSON.parse(dataStr);

    const profile = await this.profileRepository.findOne({ where: { id }, raw: true });
    if (!profile) {
      throw new NotFoundException("Профиль запроса не существует");
    }

    await this.profileRepository.update({ email }, { where: { id } });
    await Promise.all([
      this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:token:${dto.token}`),
      this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:user:${id}`),
      this.redisService.del(`${this.EMAIL_UPDATE_PREFIX}:email:${email}`)
    ]);
  }

  async requestPhoneUpdate() {}

  async confirmPhoneUpdate() {}

  async requestResetPasswordByEmail(dto: ResetPasswordEmailDto) {
    const profile = await this.profileRepository.findOne({
      where: {email: dto.email}, raw: true
    });
    if (!profile) {
      throw new NotFoundException("Профиль с таким E-Mail не существует");
    }

    const emailKey = `${this.RESET_PASSWORD_PREFIX}:email:${dto.email}`;
    if (await this.redisService.exists(emailKey)) {
      throw new HttpException(
        'Вы можете запрашивать сброс пароля не чаще чем раз в 5 минут, запрос уже отправлен, проверьте почту',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const token = randomUUID();

    await Promise.all([
      this.redisService.set(`${this.RESET_PASSWORD_PREFIX}:token:${token}`, profile.id, 300),
      this.redisService.set(`${this.RESET_PASSWORD_PREFIX}:identifier:${dto.email}`, token, 300),
    ]);

    await this.mailerService.sendMail({
      to: dto.email,
      subject: 'Сброс пароля',
      template: 'reset-password',
      context: {
        name: profile.name,
        shopName: "WORK-RC",
        expireMinutes: 5,
        resetUrl: `${this.MAIN_HOST}/reset-password?token=${token}`
      }
    });
  }

  async confirmResetPassword(dto: ConfirmResetDto) {
    const profileId = await this.redisService.get(`${this.RESET_PASSWORD_PREFIX}:token:${dto.token}`);
    if (!profileId) {
      throw new BadRequestException(
        "Неизвестный номер запроса, попробуйте повторить запрос заново",
      );
    }

    const profile = await this.profileRepository.findOne({
      where: {id: profileId}, raw: true
    });
    if (!profile) {
      throw new NotFoundException("Профиль запроса не существует");
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.profileRepository.update({ password: hashedPassword }, { where: { id: profile.id } });

    await Promise.all([
      this.redisService.del(`${this.RESET_PASSWORD_PREFIX}:token:${dto.token}`),
      this.redisService.del(`${this.RESET_PASSWORD_PREFIX}:identifier:${profile.email}`)
    ]);
  }
}
