import { Op } from "sequelize";

type RangeFilterParams = {
  options: Record<symbol, any>,
  minValue: number,
  maxValue: number,
};

export function applyRangeFilter(
  {
    options,
    minValue,
    maxValue,
  }: RangeFilterParams
): void {
  if (minValue !== -1 && maxValue !== -1) {
    if (!options[Op.and]) options[Op.and] = [];

    if (minValue !== -1) {
      options[Op.and].push({ [Op.gte]: Number(minValue) });
    }

    if (maxValue !== -1) {
      options[Op.and].push({ [Op.lte]: Number(maxValue) });
    }
  }
}