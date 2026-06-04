import { StyleSheet, View } from 'react-native';

import { AccentCard, AppButton, EmptyState, MetricTile, SectionTitle } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { spacing } from '@/src/theme/pillpal';

export default function PersonalCabinetScreen() {
  return (
    <PillPalScreen
      eyebrow="Personal meds"
      title="Tủ thuốc cá nhân"
      subtitle="Danh sách thuốc đang dùng sẽ là nguồn chính cho lịch uống và kiểm tra trước khi uống.">
      <View style={styles.metrics}>
        <MetricTile value="0" label="Thuốc đang dùng" tone="primary" />
        <MetricTile value="0" label="Đã ngừng" tone="rose" />
      </View>

      <View style={styles.actions}>
        <AppButton label="Thêm thuốc cá nhân" icon="add-circle" style={styles.action} />
        <AppButton label="Tìm trong catalog" icon="search" variant="light" style={styles.action} />
      </View>

      <SectionTitle title="Thuốc đang dùng" />
      <EmptyState
        icon="medkit"
        title="Chưa có thuốc cá nhân"
        body="Thêm thuốc, hoạt chất, hàm lượng và ghi chú để backend có đủ dữ liệu kiểm tra."
        actionLabel="Thêm thuốc"
      />

      <SectionTitle title="Thông tin cần có" />
      <View style={styles.cards}>
        <AccentCard
          icon="flask"
          tone="blue"
          title="Hoạt chất"
          body="Dùng để so khớp dị ứng và hiển thị cảnh báo dễ hiểu."
        />
        <AccentCard
          icon="document-text"
          tone="amber"
          title="Ghi chú bác sĩ"
          body="Ví dụ: uống sau ăn, cách nhau tối thiểu, hoặc hướng dẫn riêng."
        />
      </View>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
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
