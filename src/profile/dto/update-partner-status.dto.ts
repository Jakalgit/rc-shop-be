import { IsIn, IsNotEmpty } from "class-validator";
import { ProfileStatusEnum } from "../../enums/profile-status.enum";

export class UpdatePartnerStatusDto {

  @IsNotEmpty()
  id: string;

  @IsNotEmpty()
  @IsIn([
    ProfileStatusEnum.ACTIVE,
    ProfileStatusEnum.BANNED,
    ProfileStatusEnum.REJECTED
  ])
  status: ProfileStatusEnum.ACTIVE | ProfileStatusEnum.BANNED | ProfileStatusEnum.REJECTED;
}