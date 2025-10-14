import { IsNotEmpty } from "class-validator";
import { ExistingSlide, NewSlide } from "../types/dto-slides.type";
import { Transform } from "class-transformer";

export class UpdateSliderDto {

  @IsNotEmpty()
  @Transform(({ value }) => JSON.parse(value))
  items: (NewSlide | ExistingSlide)[];
}