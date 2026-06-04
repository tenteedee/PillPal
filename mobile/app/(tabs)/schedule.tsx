import { StyleSheet, View } from 'react-native';

import { AccentCard, AppButton, EmptyState, MetricTile, SectionTitle } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { palette, radius, spacing } from '@/src/theme/pillpal';

export default function ScheduleScreen() {
  return (
    <PillPalScreen
      eyebrow="Today plan"
      title="Quản lý lịch uống"
      subtitle="Các liều trong ngày sẽ được nhóm theo giờ để bắt đầu kiểm tra trước khi uống.">
      <View style={styles.metrics}>
        <MetricTile value="0" label="Lịch đang bật" tone="primary" />
        <MetricTile value="0" label="Liều hôm nay" tone="blue" />
        <MetricTile value="0" label="Cảnh báo" tone="amber" />
      </View>

      <View style={styles.quickPanel}>
        <AppButton label="Tạo lịch uống" icon="add-circle" style={styles.primaryAction} />
        <AppButton label="Xem lịch hôm nay" icon="today" variant="light" style={styles.primaryAction} />
      </View>

      <SectionTitle title="Lịch hôm nay" action="Sắp xếp theo giờ" />
      <EmptyState
        icon="calendar-clear"
        title="Chưa có lịch uống nào"
        body="Khi bạn thêm thuốc và thời gian uống, các mốc giờ sẽ xuất hiện tại đây."
        actionLabel="Thêm lịch"
      />

      <SectionTitle title="Trạng thái an toàn" />
      <View style={styles.ruleCards}>
        <AccentCard
          icon="time"
          tone="blue"
          title="Đúng thời điểm"
          body="Màn hình schedule sẽ chuyển người dùng vào kiểm tra trước khi xác nhận uống."
        />
        <AccentCard
          icon="warning"
          tone="amber"
          title="Chú ý khoảng cách liều"
          body="Backend rule engine sẽ quyết định allowed, warning hoặc blocked."
        />
      </View>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickPanel: {
    borderRadius: radius.lg,
    backgroundColor: palette.ink,
    padding: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  primaryAction: {
    flex: 1,
    minWidth: 148,
  },
  ruleCards: {
    gap: spacing.md,
  },
});
