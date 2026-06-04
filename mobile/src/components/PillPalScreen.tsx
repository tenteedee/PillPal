import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing, typography } from '@/src/theme/pillpal';
import {
  getAccessibilitySettings,
  scaleFont,
  scaleSpace,
  useAccessibilityStore,
} from '@/src/store/accessibility';

type PillPalScreenProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  scroll?: boolean;
}>;

export function PillPalScreen({
  eyebrow,
  title,
  subtitle,
  rightSlot,
  scroll = true,
  children,
}: PillPalScreenProps) {
  const settings = getAccessibilitySettings(useAccessibilityStore((state) => state.mode));

  const content = (
    <View
      style={[
        styles.content,
        {
          paddingHorizontal: settings.screenPadding,
          paddingTop: scaleSpace(spacing.lg, settings),
          gap: scaleSpace(spacing.lg, settings),
        },
      ]}>
      <View
        style={[
          styles.header,
          {
            minHeight: settings.simplified ? 98 : Math.round(130 * settings.spacingScale),
            gap: scaleSpace(spacing.lg, settings),
          },
        ]}>
        <View style={styles.headerCopy}>
          {eyebrow && !settings.simplified ? (
            <Text style={[styles.eyebrow, { fontSize: scaleFont(typography.eyebrow, settings) }]}>
              {eyebrow}
            </Text>
          ) : null}
          <Text
            style={[
              styles.title,
              {
                fontSize: scaleFont(typography.title, settings),
                lineHeight: scaleFont(36, settings),
              },
            ]}>
            {title}
          </Text>
          {subtitle && settings.showSecondaryText ? (
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: scaleFont(typography.body, settings),
                  lineHeight: scaleFont(23, settings),
                },
              ]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.safeAreaContrast]}
      edges={['top']}>
      <View
        style={[
          styles.backdrop,
          { height: settings.simplified ? 180 : Math.round(220 * settings.spacingScale) },
          settings.highContrast && styles.backdropContrast,
        ]}
      />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: settings.tabBarHeight + 44 },
          ]}
          showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  safeAreaContrast: {
    backgroundColor: palette.white,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: palette.canvasStrong,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  backdropContrast: {
    backgroundColor: palette.surface,
    borderBottomWidth: 2,
    borderColor: palette.primary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    minHeight: 130,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  eyebrow: {
    color: palette.primary,
    fontSize: typography.eyebrow,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.ink,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 36,
  },
  subtitle: {
    color: palette.muted,
    fontSize: typography.body,
    fontWeight: '500',
    lineHeight: 23,
  },
  rightSlot: {
    flexShrink: 0,
  },
});
