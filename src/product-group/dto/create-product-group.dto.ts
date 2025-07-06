import { MinLength } from "class-validator";

export class CreateProductGroupDto {

  @MinLength(5, {message: "Name length must be at least 5 characters"})
  name: string;
}