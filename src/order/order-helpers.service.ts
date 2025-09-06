import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderHelpersService {

  pick<T extends object, K extends keyof T>(obj: T, keys: string[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
}