import { SliderTagEnum } from "../enums/slider-tag.enum";

export type NewSlide = {
  filename: string;
  href: string
  title: string,
  text: string,
  buttonText: string,
  price: number | null;
  tagType: SliderTagEnum;
}

export type ExistingSlide = {
  id: number;
  href: string
  imageId?: number;
  title: string,
  text: string,
  buttonText: string,
  price: number | null;
  tagType: SliderTagEnum;
}