import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton, GlassCard, SectionTitle, StatusChip } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { palette, radius, shadows, spacing, typography } from '@/src/theme/pillpal';

export default function ScanScreen() {
  return (
    <PillPalScreen
      eyebrow="PillPal Safety"
      title="Quét thuốc trước khi uống"
      subtitle="AI chỉ gợi ý tên thuốc. Bạn luôn xác nhận trước khi hệ thống kiểm tra an toàn bằng luật.">
      <View style={styles.scanHero}>
        <View style={styles.cameraPlate}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
            <View style={styles.scanBeam} />
            <Ionicons name="medical" size={54} color={palette.primarySoft} />
            <Text style={styles.scanHint}>Đưa vỉ thuốc hoặc hộp thuốc vào khung</Text>
          </View>
        </View>
        <View style={styles.heroActions}>
          <AppButton label="Mở camera" icon="camera" style={styles.flexButton} />
          <AppButton label="Chọn ảnh" icon="image" variant="light" style={styles.flexButton} />
        </View>
      </View>

      <GlassCard style={styles.confirmCard}>
        <StatusChip label="Cần xác nhận thủ công" icon="shield-checkmark" tone="amber" />
        <Text style={styles.confirmTitle}>Tôi nghĩ đây có thể là thuốc bạn đang cầm.</Text>
        <Text style={styles.confirmBody}>Kết quả scan sau này sẽ hiện ở đây để bạn kiểm tra trước khi tiếp tục.</Text>
        <View style={styles.buttonRow}>
          <AppButton label="Đúng, kiểm tra" icon="checkmark-circle" variant="primary" style={styles.flexButton} />
          <AppButton label="Chọn thủ công" icon="list" variant="secondary" style={styles.flexButton} />
        </View>
      </GlassCard>

      <SectionTitle title="Luồng an toàn" />
      <View style={styles.flowRow}>
        <View style={styles.flowStep}>
          <Ionicons name="scan" size={20} color={palette.primary} />
          <Text style={styles.flowText}>Scan</Text>
        </View>
        <View style={styles.flowStep}>
          <Ionicons name="person" size={20} color={palette.blue} />
          <Text style={styles.flowText}>Xác nhận</Text>
        </View>
        <View style={styles.flowStep}>
          <Ionicons name="shield" size={20} color={palette.violet} />
          <Text style={styles.flowText}>Rule check</Text>
        </View>
      </View>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  scanHero: {
    gap: spacing.lg,
  },
  cameraPlate: {
    minHeight: 340,
    borderRadius: radius.xl,
    backgroundColor: palette.ink,
    padding: spacing.lg,
    ...shadows.lift,
  },
  scanFrame: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    overflow: 'hidden',
  },
  scanBeam: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 3,
    top: '46%',
    backgroundColor: palette.primarySoft,
    opacity: 0.78,
  },
  corner: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderColor: palette.primarySoft,
  },
  cornerTopLeft: {
    top: 18,
    left: 18,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radius.sm,
  },
  cornerTopRight: {
    top: 18,
    right: 18,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radius.sm,
  },
  cornerBottomLeft: {
    bottom: 18,
    left: 18,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBottomRight: {
    right: 18,
    bottom: 18,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: radius.sm,
  },
  scanHint: {
    color: palette.white,
    fontSize: typography.body,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 23,
  },
  heroActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  confirmCard: {
    gap: spacing.md,
  },
  confirmTitle: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: '900',
    lineHeight: 24,
  },
  confirmBody: {
    color: palette.muted,
    fontSize: typography.body,
    fontWeight: '500',
    lineHeight: 23,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
  flowRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flowStep: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.mutedLight,
  },
  flowText: {
    color: palette.ink,
    fontSize: typography.small,
    fontWeight: '900',
  },
});
