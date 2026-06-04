import type {
  DailyPlanDto,
  DailyPlanGroupDto,
  DailyPlanItemDto,
} from "./daily-plan.types.js";

export function mapDailyPlanItemsToDto(
  date: string,
  items: DailyPlanItemDto[],
): DailyPlanDto {
  const groupsByTime = new Map<string, DailyPlanItemDto[]>();

  for (const item of items) {
    const groupItems = groupsByTime.get(item.scheduledTime) ?? [];
    groupItems.push(item);
    groupsByTime.set(item.scheduledTime, groupItems);
  }

  const groups: DailyPlanGroupDto[] = Array.from(groupsByTime.entries())
    .sort(([leftTime], [rightTime]) => leftTime.localeCompare(rightTime))
    .map(([time, groupItems]) => ({
      time,
      items: groupItems.sort((left, right) => left.name.localeCompare(right.name)),
    }));

  return {
    date,
    groups,
  };
}
