import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";
import { HttpService } from "@nestjs/axios";
import { CdekTariffCode } from "./lib/types";

@Injectable()
export class OrderHelpersService {

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService
    ) {}

  pick<T extends object, K extends keyof T>(obj: T, keys: string[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }

  async calculateCdekDelivery(data: any, tariffCode: number): Promise<CdekTariffCode> {

    data = {
      ...data,
      currency: 1,
      lang: "rus",
      from_location: {
        address: "Спартаковская площадь, 10с12",
        city: "Москва",
        country_code: "RU",
        postal_code: "105082",
        code: 44
      },
      action: "calculate",
      packages: [
        {
          width: 10,
          height: 10,
          length: 10,
          weight: 10
        }
      ]
    }

    const response = await firstValueFrom(
      this.http.post(
        this.configService.get<string>('SERVICE_CDEK_PHP_ADDRESS'),
        data,
        {
          headers: {
            'Content-Type': 'application/json',
        },
      }),
    );

    if (response.status !== 200) {
      throw new BadRequestException('Ошибка системы СДЕК');
    }

    const tariffCodes: CdekTariffCode[] = response.data.tariff_codes || [];

    const selectedCode = tariffCodes.find(el => el.tariff_code === tariffCode);

    if (!selectedCode) {
      throw new BadRequestException('Tariff code not found.');
    }

    return selectedCode;
  }
}