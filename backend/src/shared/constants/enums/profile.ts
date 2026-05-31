export const ACCESSIBILITY_MODE = {
  NORMAL: "normal",
  ELDERLY: "elderly",
  LOW_VISION: "low_vision",
  SIMPLE: "simple",
} as const;

export const ACCESSIBILITY_MODE_VALUES = [
  ACCESSIBILITY_MODE.NORMAL,
  ACCESSIBILITY_MODE.ELDERLY,
  ACCESSIBILITY_MODE.LOW_VISION,
  ACCESSIBILITY_MODE.SIMPLE,
] as const;

export const ALLERGY_TYPE = {
  INGREDIENT: "ingredient",
  MEDICATION: "medication",
} as const;

export const ALLERGY_TYPE_VALUES = [
  ALLERGY_TYPE.INGREDIENT,
  ALLERGY_TYPE.MEDICATION,
] as const;
