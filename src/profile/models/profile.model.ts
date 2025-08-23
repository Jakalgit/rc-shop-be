import { ProfileStatusEnum } from "../../enums/profile-status.enum";
import { ProfileEnum } from "../../enums/profile.enum";
import { BeforeValidate, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";

export interface ProfileCreationAttrs {
  name: string;
  phone: string;
  email: string;
  password?: string;
  descriptionOfActivities?: string;
  organization?: string;
  status?: ProfileStatusEnum;
  type: ProfileEnum;
}

@Table({ tableName: 'profiles' })
export class Profile extends Model<Profile, ProfileCreationAttrs> {

  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({ type: DataType.UUID })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  phone: string;

  @Column({ type: DataType.STRING, allowNull: false })
  email: string;

  @Column({ type: DataType.STRING })
  password: string;

  @Column({ type: DataType.TEXT })
  descriptionOfActivities: string;

  @Column({ type: DataType.TEXT })
  organization: string;

  @Column({ type: DataType.ENUM(...Object.values(ProfileStatusEnum)), allowNull: false, defaultValue: ProfileStatusEnum.PENDING })
  status: ProfileStatusEnum;

  @Column({ type: DataType.ENUM(...Object.values(ProfileEnum)), allowNull: false })
  type: ProfileEnum;

  @BeforeValidate
  static validateFields(instance: Profile) {
    if (
      instance.status === ProfileStatusEnum.ACTIVE &&
      (!instance.password || instance.password.trim() === '')
    ) {
      throw new Error('Password is required when status is ACTIVE');
    }

    if (instance.type === ProfileEnum.PARTNER) {
      if (!instance.email || instance.email.trim() === '') {
        throw new Error('Email is required when type is PARTNER');
      }
      if (
        !instance.descriptionOfActivities ||
        instance.descriptionOfActivities.trim() === ''
      ) {
        throw new Error('Description of activities is required when type is PARTNER');
      }
      if (!instance.organization || instance.organization.trim() === '') {
        throw new Error('Organization is required when type is PARTNER');
      }
    }
  }
}