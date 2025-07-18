import { IsNotEmpty } from "class-validator";
import { ExistingSlide, NewSlide } from "../types/dto-slides.type";

export class UpdateSliderDto {

  @IsNotEmpty()
  items: (NewSlide | ExistingSlide)[];
}