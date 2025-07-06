import { IsNumber, Length } from "class-validator";

export class UpdateGroupDto {

  @IsNumber({}, {message: "id must be an integer"})
  id: number;

  @Length(2, 40, {message: 'Name length: 2 - 40 symbols'})
  name: string;
}