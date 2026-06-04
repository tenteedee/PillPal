import { StyleSheet, Text, View } from 'react-native';

import { AccentCard, AppButton, GlassCard, SectionTitle, StatusChip } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { palette, radius, spacing, typography } from '@/src/theme/pillpal';

const accessibilityModes = ['Bình thường', 'Người lớn tuổi', 'Thị lực yếu', 'Đơn giản'];

export default function SettingsScreen() {
  return (
    <PillPalScreen
      eyebrow="Settings"
      title="Cài đặt & hồ sơ"
      subtitle="Thiết lập hồ sơ sức khỏe, người hỗ trợ và chế độ hiển thị dễ đọc cho demo MVP.">
      <GlassCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>P</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={styles.profileName}>Hồ sơ PillPal</Text>
          <Text style={styles.profileNote}>Chưa thiết lập thông tin sức khỏe</Text>
        </View>
        <StatusChip label="MVP" icon="rocket" tone="blue" />
      </GlassCard>

      <SectionTitle title="Chế độ truy cập" />
      <View style={styles.modeGrid}>
        {accessibilityModes.map((mode, index) => (
          <View key={mode} style={[styles.modePill, index === 0 && styles.modePillActive]}>
            <Text style={[styles.modeText, index === 0 && styles.modeTextActive]}>{mode}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton label="Cập nhật hồ sơ" icon="person-circle" style={styles.action} />
        <AppButton label="Người hỗ trợ" icon="call" variant="light" style={styles.action} />
      </View>

      <SectionTitle title="An toàn y tế" />
      <View style={styles.cards}>
        <AccentCard
          icon="shield-checkmark"
          tone="primary"
          title="Quyết định bằng rule engine"
          body="AI không quyết định thuốc có an toàn để uống hay không."
        />
        <AccentCard
          icon="volume-high"
          tone="violet"
          title="Đọc cảnh báo"
          body="Các màn quan trọng sẽ có nút đọc lại cho người dùng thị lực yếu."
        />
      </View>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: palette.white,
    fontSize: 26,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: '900',
  },
  profileNote: {
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: '700',
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modePill: {
    minHeight: 46,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.mutedLight,
  },
  modePillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  modeText: {
    color: palette.ink,
    fontSize: typography.small,
    fontWeight: '900',
  },
  modeTextActive: {
    color: palette.white,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
  cards: {
    gap: spacing.md,
  },
});
