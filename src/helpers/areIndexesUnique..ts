import { BadRequestException } from "@nestjs/common";

export function areIndexesUnique(arr: { index: number; [key: string]: any }[], errMsg: string = "Индексы в массиве должны быть уникальны") {
  const seen = new Set<number>();

  for (const item of arr) {
    if (seen.has(item.index)) {
      throw new BadRequestException(errMsg);
    }
    seen.add(item.index);
  }
}