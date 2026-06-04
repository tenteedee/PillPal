import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, PropsWithChildren } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import {
  palette,
  radius,
  shadows,
  spacing,
  typography,
} from "@/src/theme/pillpal";
import {
  getAccessibilitySettings,
  scaleFont,
  useAccessibilityStore,
} from "@/src/store/accessibility";

type IconName = ComponentProps<typeof Ionicons>["name"];

type AppButtonProps = PressableProps & {
  label: string;
  icon?: IconName;
  variant?: "primary" | "secondary" | "light" | "danger" | "ghost";
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  icon,
  variant = "primary",
  style,
  ...pressableProps
}: AppButtonProps) {
  const onDark = variant === "primary" || variant === "danger";
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        buttonStyles[variant],
        {
          minHeight: settings.minTapTarget,
          paddingHorizontal: settings.cardPadding,
        },
        settings.highContrast &&
          variant === "light" &&
          styles.highContrastLight,
        pressed && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={scaleFont(20, settings)}
          color={onDark ? palette.white : palette.primary}
        />
      ) : null}
      <Text
        numberOfLines={settings.simplified ? 1 : 2}
        style={[
          styles.buttonText,
          { fontSize: scaleFont(typography.body, settings) },
          onDark && styles.buttonTextOnDark,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function GlassCard({
  children,
  style,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <View
      style={[
        styles.card,
        {
          padding: settings.cardPadding,
          borderColor: settings.highContrast
            ? palette.primary
            : "rgba(19, 35, 31, 0.06)",
          borderWidth: settings.highContrast ? 2 : 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function AccentCard({
  icon,
  tone,
  title,
  body,
  actionLabel,
}: {
  icon: IconName;
  tone: "primary" | "blue" | "amber" | "rose" | "violet";
  title: string;
  body: string;
  actionLabel?: string;
}) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <View
      style={[
        styles.accentCard,
        accentStyles[tone],
        {
          padding: settings.cardPadding,
          minHeight: settings.simplified ? 132 : 172,
          borderWidth: settings.highContrast ? 2 : 0,
          borderColor: settings.highContrast ? iconColors[tone] : "transparent",
        },
      ]}
    >
      <View style={[styles.iconBadge, iconBadgeStyles[tone]]}>
        <Ionicons
          name={icon}
          size={scaleFont(22, settings)}
          color={iconColors[tone]}
        />
      </View>
      <View style={styles.accentCopy}>
        <Text
          style={[
            styles.cardTitle,
            { fontSize: scaleFont(typography.lead, settings) },
          ]}
        >
          {title}
        </Text>
        {settings.showSecondaryText ? (
          <Text
            style={[
              styles.cardBody,
              { fontSize: scaleFont(typography.body, settings) },
            ]}
          >
            {body}
          </Text>
        ) : null}
      </View>
      {actionLabel && !settings.simplified ? (
        <Text
          style={[
            styles.textAction,
            textActionStyles[tone],
            { fontSize: scaleFont(typography.small, settings) },
          ]}
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
}: {
  icon: IconName;
  title: string;
  body: string;
  actionLabel?: string;
}) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <GlassCard style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={icon}
          size={scaleFont(30, settings)}
          color={palette.primary}
        />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { fontSize: scaleFont(typography.lead, settings) },
        ]}
      >
        {title}
      </Text>
      {settings.showSecondaryText ? (
        <Text
          style={[
            styles.emptyBody,
            { fontSize: scaleFont(typography.body, settings) },
          ]}
        >
          {body}
        </Text>
      ) : null}
      {actionLabel ? (
        <AppButton label={actionLabel} icon="add" variant="secondary" />
      ) : null}
    </GlassCard>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <View style={styles.sectionTitle}>
      <Text
        style={[
          styles.sectionHeading,
          { fontSize: scaleFont(typography.lead, settings) },
        ]}
      >
        {title}
      </Text>
      {action && !settings.simplified ? (
        <Text
          style={[
            styles.sectionAction,
            { fontSize: scaleFont(typography.small, settings) },
          ]}
        >
          {action}
        </Text>
      ) : null}
    </View>
  );
}

export function StatusChip({
  label,
  icon,
  tone = "primary",
  style,
}: {
  label: string;
  icon: IconName;
  tone?: "primary" | "blue" | "amber" | "rose" | "violet";
  style?: StyleProp<ViewStyle>;
}) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <View
      style={[
        styles.statusChip,
        iconBadgeStyles[tone],
        {
          minHeight: Math.max(38, Math.round(settings.minTapTarget * 0.7)),
          borderWidth: settings.highContrast ? 1 : 0,
          borderColor: iconColors[tone],
        },
        style,
      ]}
    >
      <Ionicons
        name={icon}
        size={scaleFont(16, settings)}
        color={iconColors[tone]}
      />
      <Text
        style={[
          styles.statusLabel,
          {
            color: iconColors[tone],
            fontSize: scaleFont(typography.small, settings),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export function MetricTile({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "blue" | "amber" | "rose" | "violet";
}) {
  const settings = getAccessibilitySettings(
    useAccessibilityStore((state) => state.mode),
  );

  return (
    <View
      style={[
        styles.metricTile,
        metricStyles[tone],
        {
          minHeight: settings.simplified
            ? 82
            : Math.round(92 * settings.spacingScale),
          padding: settings.cardPadding,
          borderWidth: settings.highContrast ? 1 : 0,
          borderColor: iconColors[tone],
        },
      ]}
    >
      <Text style={[styles.metricValue, { fontSize: scaleFont(26, settings) }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.metricLabel,
          { fontSize: scaleFont(typography.small, settings) },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: palette.primary,
  },
  secondary: {
    backgroundColor: palette.primarySoft,
  },
  light: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.mutedLight,
  },
  danger: {
    backgroundColor: palette.rose,
  },
  ghost: {
    backgroundColor: "transparent",
  },
});

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  buttonText: {
    color: palette.primary,
    fontSize: typography.body,
    fontWeight: "800",
    letterSpacing: 0,
    textAlign: "center",
  },
  buttonTextOnDark: {
    color: palette.white,
  },
  highContrastLight: {
    borderColor: palette.primary,
    borderWidth: 2,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(19, 35, 31, 0.06)",
    ...shadows.card,
  },
  accentCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    minHeight: 172,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  accentCopy: {
    gap: spacing.xs,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: "900",
    lineHeight: 24,
  },
  cardBody: {
    color: palette.inkSoft,
    fontSize: typography.body,
    fontWeight: "500",
    lineHeight: 23,
  },
  textAction: {
    marginTop: "auto",
    fontSize: typography.small,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primarySoft,
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyBody: {
    color: palette.muted,
    fontSize: typography.body,
    fontWeight: "500",
    lineHeight: 23,
    textAlign: "center",
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionHeading: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: "900",
  },
  sectionAction: {
    color: palette.primary,
    fontSize: typography.small,
    fontWeight: "900",
  },
  statusChip: {
    minHeight: 38,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusLabel: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  metricTile: {
    flex: 1,
    minHeight: 92,
    borderRadius: radius.md,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  metricValue: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  metricLabel: {
    color: palette.inkSoft,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 18,
  },
});

const accentStyles = StyleSheet.create({
  primary: { backgroundColor: palette.primarySoft },
  blue: { backgroundColor: palette.blueSoft },
  amber: { backgroundColor: palette.amberSoft },
  rose: { backgroundColor: palette.roseSoft },
  violet: { backgroundColor: palette.violetSoft },
});

const iconBadgeStyles = StyleSheet.create({
  primary: { backgroundColor: palette.primarySoft },
  blue: { backgroundColor: palette.blueSoft },
  amber: { backgroundColor: palette.amberSoft },
  rose: { backgroundColor: palette.roseSoft },
  violet: { backgroundColor: palette.violetSoft },
});

const metricStyles = StyleSheet.create({
  primary: { backgroundColor: palette.primarySoft },
  blue: { backgroundColor: palette.blueSoft },
  amber: { backgroundColor: palette.amberSoft },
  rose: { backgroundColor: palette.roseSoft },
  violet: { backgroundColor: palette.violetSoft },
});

const textActionStyles: Record<string, StyleProp<TextStyle>> = {
  primary: { color: palette.primary },
  blue: { color: palette.blue },
  amber: { color: palette.amber },
  rose: { color: palette.rose },
  violet: { color: palette.violet },
};

const iconColors = {
  primary: palette.primary,
  blue: palette.blue,
  amber: palette.amber,
  rose: palette.rose,
  violet: palette.violet,
};
