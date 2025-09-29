import { ArgumentMetadata, ParseIntPipe } from "@nestjs/common";

export class OptionalParseIntPipe extends ParseIntPipe {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === '' || isNaN(value)) return undefined;
    return super.transform(value, metadata);
  }
}