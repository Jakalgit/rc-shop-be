import { IsNotEmpty, IsNumber, IsOptional, Length } from "class-validator";

export class UpdateTagDto {

  @IsNumber({}, {message: "id must be an integer"})
  id: number;

  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 40, { message: 'Name length: 2 - 40 symbols' })
  name: string;

  @IsOptional()
  @IsNumber({}, { message: 'groupId must be a number' })
  groupId?: number;
}