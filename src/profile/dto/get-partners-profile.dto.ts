import { IsEnum, IsOptional } from "class-validator";
import { ProfileStatusEnum } from "../../enums/profile-status.enum";
import { Transform, Type } from "class-transformer";

export class GetPartnersProfileDto {

  @IsOptional()
  @IsEnum(ProfileStatusEnum)
  @Type(() => String) // обязательно, чтобы корректно преобразовать тип
  status?: ProfileStatusEnum;

  @IsOptional()
  @Transform(({ value }) => value ?? 1)
  page: number;

  @IsOptional()
  @Transform(({ value }) => value ?? 12)
  limit: number;
}