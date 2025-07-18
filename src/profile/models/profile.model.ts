import { ProfileStatusEnum } from "../../enums/profile-status.enum";
import { ProfileEnum } from "../../enums/profile.enum";
import { Column, DataType, Model, Table } from "sequelize-typescript";

export interface ProfileCreationAttrs {
  name: string;
  phone: string;
  email: string;
  password: string;
  descriptionOfActivities: string;
  status?: ProfileStatusEnum;
  type: ProfileEnum;
}

@Table({ tableName: 'profiles' })
export class Profile extends Model<Profile, ProfileCreationAttrs> {

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password: string;

  @Column({ type: DataType.TEXT })
  descriptionOfActivities: string;

  @Column({ type: DataType.ENUM(...Object.values(ProfileStatusEnum)), allowNull: false, defaultValue: ProfileStatusEnum.PENDING })
  status: ProfileStatusEnum;

  @Column({ type: DataType.ENUM(...Object.values(ProfileEnum)), allowNull: false })
  type: ProfileEnum;
}