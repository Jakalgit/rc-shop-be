
export enum CdekDeliveryEnum {
  DOOR = 'door',
  OFFICE = 'office',
}

export type CdekTariffCode = {
  calendar_max: number;
  calendar_min: number;
  delivery_date_range: {min: string, max: string};
  delivery_mode: number;
  delivery_sum: number;
  period_max: number;
  period_min: number;
  tariff_code: number;
  tariff_description: string;
  tariff_name: string;
}

export type CdekOfficeAddressType = {
  address: string;
  allowed_cod: boolean;
  city: string;
  city_code: number;
  code: string;
  country_code: string;
  have_cash: boolean;
  have_cashless: boolean;
  is_dressing_room: boolean;
  location: [number, number];
  name: string;
  postal_code: string;
  region: string;
  type: string;
  weight_max: number;
  weight_min: number;
  work_time: string;
}

export type CdekDoorAddressType = {
  bounds: {
    lower: [number, number];
    upper: [number, number];
  },
  city: string;
  components: {kind: string, name: string}[];
  country_code: string;
  formatted: string;
  kind: string;
  name: string;
  position: [number, number];
  postal_code: string;
  precision: string;
}

export type CdekMetadataType = {
  delivery: CdekDeliveryEnum.DOOR,
  rate: CdekTariffCode,
  address: CdekDoorAddressType
} | {
  delivery: CdekDeliveryEnum.OFFICE,
  rate: CdekTariffCode,
  address: CdekOfficeAddressType,
};