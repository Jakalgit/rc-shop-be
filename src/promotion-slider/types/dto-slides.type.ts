
export type NewSlide = {
  filename: string;
  href: string
}

export type ExistingSlide = {
  id: number;
  href: string
  imageId?: number;
}