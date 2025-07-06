import { Length } from "class-validator";

export class CreateGroupDto {

  @Length(2, 40, {message: 'Name length: 2 - 40 symbols'})
  name: string;
}