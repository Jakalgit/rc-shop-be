import { ProductSortEnum } from "../../enums/product-sort.enum";

export class GetProductDto {

  id: number;

  finder: string;

  article: string;

  page: number;

  limit: number;

  tagIds: number[];

  productGroupId: number;

  minPrice: number;

  maxPrice: number;

  wMinPrice: number;

  wMaxPrice: number;

  showUnavailable: boolean;

  sortType: ProductSortEnum;
}