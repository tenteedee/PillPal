export type DailyPlanStatus =
  | "not_yet"
  | "due"
  | "taken"
  | "missed"
  | "warning"
  | "blocked";

export type DailyPlanScheduleMedicationRow = {
  scheduleId: string;
  profileId: string;
  userMedicationId: string;
  medicationName: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  imageUrl: string | null;
  doseAmount: string;
  times: string[];
  instruction: string | null;
};

export type DailyPlanItemDto = {
  userMedicationId: string;
  scheduleId: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  imageUrl: string | null;
  doseAmount: string;
  instruction: string | null;
  scheduledTime: string;
  status: DailyPlanStatus;
};

export type DailyPlanGroupDto = {
  time: string;
  items: DailyPlanItemDto[];
};

export type DailyPlanDto = {
  date: string;
  groups: DailyPlanGroupDto[];
};
