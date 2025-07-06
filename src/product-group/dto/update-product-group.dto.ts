import { IsNumber, MinLength } from "class-validator";

export class UpdateProductGroupDto {

  @IsNumber()
  id: number;

  @MinLength(5, {message: "Name length must be at least 5 characters"})
  name: string;
}