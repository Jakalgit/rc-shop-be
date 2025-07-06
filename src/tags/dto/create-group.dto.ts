import { Length } from "class-validator";

export class GroupDto {

  @Length(2, 40, {message: 'Name length: 2 - 40 symbols'})
  name: string;
}