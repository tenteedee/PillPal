import { create } from 'zustand';

export type AccessibilityMode = 'normal' | 'elderly' | 'low_vision' | 'simple';

export type AccessibilitySettings = {
  fontScale: number;
  spacingScale: number;
  minTapTarget: number;
  highContrast: boolean;
  simplified: boolean;
  showSecondaryText: boolean;
  cardPadding: number;
  screenPadding: number;
  tabBarHeight: number;
  tabFontSize: number;
};

export type AccessibilityModeOption = {
  id: AccessibilityMode;
  label: string;
  icon: string;
  description: string;
  sampleTitle: string;
  sampleBody: string;
};

export const accessibilityModeOptions: AccessibilityModeOption[] = [
  {
    id: 'normal',
    label: 'Bình thường',
    icon: 'phone-portrait',
    description: 'Gọn, đủ thông tin cho người dùng quen thao tác.',
    sampleTitle: 'Giao diện cân bằng',
    sampleBody: 'Chữ vừa phải, nhiều thông tin hơn trên một màn hình.',
  },
  {
    id: 'elderly',
    label: 'Người lớn tuổi',
    icon: 'accessibility',
    description: 'Chữ lớn hơn, thẻ rộng hơn, nút dễ bấm.',
    sampleTitle: 'Dễ đọc hơn',
    sampleBody: 'Ưu tiên cỡ chữ lớn và khoảng cách thoáng.',
  },
  {
    id: 'low_vision',
    label: 'Thị lực yếu',
    icon: 'eye',
    description: 'Tương phản mạnh, chữ lớn và cảnh báo nổi bật.',
    sampleTitle: 'Tương phản cao',
    sampleBody: 'Nền rõ, icon và chữ cảnh báo dễ nhận biết hơn.',
  },
  {
    id: 'simple',
    label: 'Đơn giản',
    icon: 'list',
    description: 'Giảm chi tiết phụ, tập trung vào hành động chính.',
    sampleTitle: 'Ít chi tiết hơn',
    sampleBody: 'Mỗi khu vực chỉ giữ thông tin quan trọng nhất.',
  },
];

export const accessibilitySettingsByMode: Record<AccessibilityMode, AccessibilitySettings> = {
  normal: {
    fontScale: 1,
    spacingScale: 1,
    minTapTarget: 56,
    highContrast: false,
    simplified: false,
    showSecondaryText: true,
    cardPadding: 18,
    screenPadding: 24,
    tabBarHeight: 78,
    tabFontSize: 11,
  },
  elderly: {
    fontScale: 1.12,
    spacingScale: 1.12,
    minTapTarget: 64,
    highContrast: false,
    simplified: false,
    showSecondaryText: true,
    cardPadding: 22,
    screenPadding: 24,
    tabBarHeight: 86,
    tabFontSize: 12,
  },
  low_vision: {
    fontScale: 1.22,
    spacingScale: 1.18,
    minTapTarget: 68,
    highContrast: true,
    simplified: false,
    showSecondaryText: true,
    cardPadding: 24,
    screenPadding: 22,
    tabBarHeight: 92,
    tabFontSize: 13,
  },
  simple: {
    fontScale: 1.08,
    spacingScale: 1.08,
    minTapTarget: 62,
    highContrast: false,
    simplified: true,
    showSecondaryText: false,
    cardPadding: 20,
    screenPadding: 24,
    tabBarHeight: 84,
    tabFontSize: 12,
  },
};

type AccessibilityState = {
  mode: AccessibilityMode;
  setMode: (mode: AccessibilityMode) => void;
};

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  mode: 'normal',
  setMode: (mode) => set({ mode }),
}));

export function getAccessibilitySettings(mode: AccessibilityMode): AccessibilitySettings {
  return accessibilitySettingsByMode[mode];
}

export function scaleFont(baseSize: number, settings: AccessibilitySettings): number {
  return Math.round(baseSize * settings.fontScale);
}

export function scaleSpace(baseSize: number, settings: AccessibilitySettings): number {
  return Math.round(baseSize * settings.spacingScale);
}
