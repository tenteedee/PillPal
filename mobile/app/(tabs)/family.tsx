import { StyleSheet, View } from 'react-native';

import { AccentCard, AppButton, EmptyState, SectionTitle, StatusChip } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { spacing } from '@/src/theme/pillpal';

export default function FamilyCabinetScreen() {
  return (
    <PillPalScreen
      eyebrow="Family cabinet"
      title="Tủ thuốc gia đình"
      subtitle="Theo dõi thuốc dùng chung trong nhà, nhưng vẫn cần xác nhận trước khi kiểm tra cho từng người.">
      <View style={styles.actions}>
        <AppButton label="Thêm thuốc gia đình" icon="add-circle" style={styles.action} />
        <AppButton label="Quét nhãn thuốc" icon="scan" variant="light" style={styles.action} />
      </View>

      <SectionTitle title="Tình trạng tủ thuốc" />
      <View style={styles.statusGrid}>
        <StatusChip label="0 thuốc" icon="file-tray" tone="primary" style={styles.statusChip} />
        <StatusChip label="Chưa đồng bộ" icon="cloud-offline" tone="violet" style={styles.statusChip} />
      </View>

      <EmptyState
        icon="file-tray-stacked"
        title="Tủ thuốc gia đình đang trống"
        body="Thuốc dùng chung trong nhà sẽ được lưu riêng để tránh nhầm với thuốc cá nhân."
        actionLabel="Thêm thuốc"
      />

      <SectionTitle title="Guardrail" />
      <View style={styles.cards}>
        <AccentCard
          icon="people-circle"
          tone="violet"
          title="Chọn đúng người dùng"
          body="Trước khi kiểm tra an toàn, app sẽ cần biết thuốc này dành cho hồ sơ nào."
        />
        <AccentCard
          icon="shield"
          tone="primary"
          title="Không tự xác nhận uống"
          body="Scan hoặc tủ thuốc chỉ giúp chọn thuốc; kết quả cuối cùng thuộc về rule engine."
        />
      </View>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusChip: {
    flex: 1,
    justifyContent: 'center',
  },
  cards: {
    gap: spacing.md,
  },
});
