import { ProfileJwtPayloadType } from "../auth/payload-types/profile-payload.type";

export type AdditionalBodyDataType = {
  wholesalePriceAccess?: boolean;
  account?: ProfileJwtPayloadType
}