import { IsNotEmpty, Length } from "class-validator";

export class CreateTagDto {

  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 40, { message: 'Name length: 2 - 40 symbols' })
  name: string;
}