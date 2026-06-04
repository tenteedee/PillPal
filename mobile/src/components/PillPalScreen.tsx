import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, radius, spacing, typography } from '@/src/theme/pillpal';

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
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.backdrop} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
