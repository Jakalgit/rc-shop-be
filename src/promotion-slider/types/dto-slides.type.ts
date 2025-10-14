
export type NewSlide = {
  filename: string;
  href: string
  title: string,
  text: string,
  buttonText: string,
}

export type ExistingSlide = {
  id: number;
  href: string
  imageId?: number;
  title: string,
  text: string,
  buttonText: string,
}