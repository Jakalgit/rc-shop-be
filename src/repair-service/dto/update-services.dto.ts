import { ArrayMinSize } from "class-validator";

export class UpdateServiceDto {

  @ArrayMinSize(1, {message: "You should send at least one item"})
  items: {service: string, price: string}[];
}