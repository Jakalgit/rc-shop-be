import { ProfileEnum } from "../../enums/profile.enum";

export type ProfileJwtPayloadType = {
  uuid: string;
  profileType: ProfileEnum;
}