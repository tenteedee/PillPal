import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getNotificationById, type NotificationEvent } from '@/src/api/notification.api';
import { AppButton, GlassCard, SectionTitle, StatusChip } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { palette, radius, spacing, typography } from '@/src/theme/pillpal';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const notificationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [notification, setNotification] = useState<NotificationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notificationId) {
      setError('Thiếu notification id.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getNotificationById(notificationId)
      .then((nextNotification) => {
        if (!cancelled) setNotification(nextNotification);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được thông báo.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [notificationId]);

  const payloadText = useMemo(
    () => JSON.stringify(notification?.payload ?? {}, null, 2),
    [notification?.payload],
  );

  return (
    <PillPalScreen
      eyebrow="Notification"
      title="Chi tiết thông báo"
      subtitle="Dùng cho caregiver xem cảnh báo, xác nhận uống thuốc hoặc scan cần kiểm tra.">
      <View style={styles.topActions}>
        <AppButton label="Quay lại" icon="arrow-back" variant="light" onPress={() => router.back()} />
        {notification?.eventType === 'medication_reminder' ? (
          <AppButton label="Xem lịch hôm nay" icon="today" onPress={() => router.push('/(tabs)/schedule')} />
        ) : null}
      </View>

      {loading ? (
        <GlassCard style={styles.loadingCard}>
          <ActivityIndicator color={palette.primary} />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </GlassCard>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Ionicons name="warning" size={22} color={palette.rose} />
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : notification ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.detailCard}>
            <View style={styles.headerRow}>
              <View style={styles.iconBox}>
                <Ionicons name={iconForEvent(notification.eventType)} size={24} color={palette.primary} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.body}>{notification.body}</Text>
              </View>
            </View>
            <View style={styles.chipRow}>
              <StatusChip label={notification.eventType} icon="notifications" tone="blue" />
              <StatusChip label={notification.status} icon="ellipse" tone={toneForStatus(notification.status)} />
            </View>
          </GlassCard>

          <SectionTitle title="Payload" />
          <GlassCard style={styles.payloadCard}>
            <Text style={styles.payloadText}>{payloadText}</Text>
          </GlassCard>

          <SectionTitle title="Điều hướng gợi ý" />
          <GlassCard style={styles.actionHintCard}>
            <Text style={styles.actionHintText}>{hintForEvent(notification)}</Text>
          </GlassCard>
        </ScrollView>
      ) : null}
    </PillPalScreen>
  );
}

function iconForEvent(eventType: NotificationEvent['eventType']) {
  if (eventType === 'safety_blocked') return 'ban';
  if (eventType === 'safety_warning') return 'warning';
  if (eventType === 'medication_reminder') return 'alarm';
  if (eventType === 'scan_unknown_medicine') return 'scan';
  if (eventType === 'intake_confirmed_after_warning') return 'alert-circle';
  if (eventType === 'intake_confirmed') return 'checkmark-circle';
  return 'notifications';
}

function toneForStatus(status: NotificationEvent['status']) {
  if (status === 'failed') return 'rose' as const;
  if (status === 'pending') return 'amber' as const;
  if (status === 'cancelled') return 'violet' as const;
  return 'primary' as const;
}

function hintForEvent(notification: NotificationEvent): string {
  if (notification.eventType === 'safety_warning') {
    return 'Caregiver nên xem payload.safetyCheckEventId để mở cảnh báo safety warning.';
  }
  if (notification.eventType === 'safety_blocked') {
    return 'Caregiver nên xem payload.safetyCheckEventId để mở cảnh báo blocked.';
  }
  if (notification.eventType === 'intake_confirmed_after_warning') {
    return 'Patient đã xác nhận uống sau warning, cần chú ý cao hơn.';
  }
  if (notification.eventType === 'intake_confirmed') {
    return 'Patient đã xác nhận uống thuốc.';
  }
  if (notification.eventType === 'scan_unknown_medicine') {
    return 'Dùng payload.medicineLookupId hoặc payload.scanAttemptId để mở luồng review thuốc scan chưa rõ.';
  }
  if (notification.eventType === 'medication_reminder') {
    return 'Mở lịch hôm nay để xem liều cần uống.';
  }
  return 'Thông báo hệ thống PillPal.';
}

const styles = StyleSheet.create({
  topActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: palette.inkSoft,
    fontSize: typography.body,
    fontWeight: '800',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.roseSoft,
  },
  errorText: {
    flex: 1,
    color: palette.rose,
    fontSize: typography.small,
    fontWeight: '800',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  detailCard: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primarySoft,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: '900',
    lineHeight: 25,
  },
  body: {
    color: palette.muted,
    fontSize: typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  payloadCard: {
    backgroundColor: palette.surface,
  },
  payloadText: {
    color: palette.inkSoft,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 20,
  },
  actionHintCard: {
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },
  actionHintText: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '800',
    lineHeight: 22,
  },
});
