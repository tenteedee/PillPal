import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiFetch } from "@/src/api/client";
import { CaregiverForPatient, listCaregivers } from "@/src/api/caregiver.api";
import {
  listNotifications,
  NotificationEvent,
} from "@/src/api/notification.api";
import {
  AccentCard,
  AppButton,
  EmptyState,
  GlassCard,
  SectionTitle,
  StatusChip,
} from "@/src/components/PillPalUI";
import { PillPalScreen } from "@/src/components/PillPalScreen";
import { useAuthStore } from "@/src/store/auth";
import {
  accessibilityModeOptions,
  getAccessibilitySettings,
  type AccessibilityMode,
  type AccessibilityModeOption,
  useAccessibilityStore,
} from "@/src/store/accessibility";
import { palette, radius, spacing, typography } from "@/src/theme/pillpal";

type IconName = ComponentProps<typeof Ionicons>["name"];
type ModeOption = AccessibilityModeOption & { icon: IconName };

const accessibilityModes: ModeOption[] = accessibilityModeOptions.map(
  (mode) => ({
    ...mode,
    icon: mode.icon as IconName,
  }),
);

export default function SettingsScreen() {
  const logoutStore = useAuthStore((state) => state.logout);
  const [caregivers, setCaregivers] = useState<CaregiverForPatient[]>([]);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [selectedCaregiver, setSelectedCaregiver] =
    useState<CaregiverForPatient | null>(null);
  const [isLoadingCaregivers, setIsLoadingCaregivers] = useState(true);
  const [caregiverError, setCaregiverError] = useState<string | null>(null);

  const selectedMode = useAccessibilityStore((state) => state.mode);
  const setAccessibilityMode = useAccessibilityStore((state) => state.setMode);
  const activeMode =
    accessibilityModes.find((mode) => mode.id === selectedMode) ??
    accessibilityModes[0];
  const activeSettings = getAccessibilitySettings(selectedMode);

  useEffect(() => {
    let cancelled = false;

    setIsLoadingCaregivers(true);
    setCaregiverError(null);

    Promise.all([
      listCaregivers(),
      listNotifications({ page: 1, limit: 3 }).catch(
        () => [] as NotificationEvent[],
      ),
    ])
      .then(([nextCaregivers, nextNotifications]) => {
        if (cancelled) return;
        setCaregivers(nextCaregivers);
        setNotifications(nextNotifications);
      })
      .catch((error) => {
        if (cancelled) return;
        setCaregiverError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách người hỗ trợ.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCaregivers(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Backend logout failed or session expired:", e);
    } finally {
      logoutStore();
    }
  };

  return (
    <>
      <PillPalScreen
        eyebrow="Settings"
        title="Cài đặt"
        subtitle="Thiết lập người hỗ trợ và chế độ hiển thị phù hợp."
      >
        <SectionTitle
          title="Người có thể liên hệ"
          action={
            caregivers.length ? caregivers.length + " liên hệ" : undefined
          }
        />
        {isLoadingCaregivers ? (
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator color={palette.primary} />
            <Text style={styles.loadingText}>
              Đang tải danh sách người hỗ trợ...
            </Text>
          </GlassCard>
        ) : caregiverError ? (
          <GlassCard style={styles.errorCard}>
            <Ionicons name="warning" size={22} color={palette.rose} />
            <Text style={styles.errorText}>{caregiverError}</Text>
          </GlassCard>
        ) : caregivers.length ? (
          <View style={styles.caregiverList}>
            {caregivers.map((caregiver) => (
              <CaregiverCard
                key={caregiver.id}
                caregiver={caregiver}
                settings={activeSettings}
                onPress={() => setSelectedCaregiver(caregiver)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="people-circle"
            title="Chưa có người hỗ trợ"
            body="Khi bạn mời caregiver và họ chấp nhận, họ sẽ xuất hiện ở đây để nhận cảnh báo an toàn."
          />
        )}

        <SectionTitle
          title="Giao diện theo đối tượng"
          action={activeMode.label}
        />
        <View style={styles.modeGrid}>
          {accessibilityModes.map((mode) => {
            const isActive = mode.id === selectedMode;
            return (
              <Pressable
                key={mode.id}
                accessibilityRole="button"
                onPress={() =>
                  setAccessibilityMode(mode.id as AccessibilityMode)
                }
                style={({ pressed }) => [
                  styles.modePill,
                  isActive && styles.modePillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={mode.icon}
                  size={18}
                  color={isActive ? palette.white : palette.primary}
                />
                <Text
                  style={[styles.modeText, isActive && styles.modeTextActive]}
                >
                  {mode.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ThemePreview mode={activeMode} settings={activeSettings} />

        <View style={styles.actions}>
          <AppButton
            label="Cập nhật hồ sơ"
            icon="person-circle"
            style={styles.action}
          />
          <AppButton
            label="Đăng xuất"
            icon="log-out"
            variant="danger"
            onPress={handleLogout}
            style={styles.action}
          />
        </View>

        <SectionTitle title="Thông báo gần đây" />
        {notifications.length ? (
          <View style={styles.notificationList}>
            {notifications.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                settings={activeSettings}
              />
            ))}
          </View>
        ) : (
          <GlassCard style={styles.notificationEmpty}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={palette.primary}
            />
            <Text style={styles.notificationEmptyText}>
              Chưa có thông báo nào cho hồ sơ hiện tại.
            </Text>
          </GlassCard>
        )}

        <SectionTitle title="An toàn y tế" />
        <View style={styles.cards}>
          <AccentCard
            icon="shield-checkmark"
            tone="primary"
            title="Quyết định bằng rule engine"
            body="AI không quyết định thuốc có an toàn để uống hay không."
          />
          <AccentCard
            icon="notifications"
            tone="violet"
            title="Cảnh báo caregiver"
            body="Khi safety check là warning hoặc blocked, backend tạo notification và gửi push cho caregiver có quyền nhận cảnh báo."
          />
        </View>
      </PillPalScreen>

      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        settings={activeSettings}
        onClose={() => setSelectedCaregiver(null)}
      />
    </>
  );
}

function CaregiverCard({
  caregiver,
  settings,
  onPress,
}: {
  caregiver: CaregiverForPatient;
  settings: ReturnType<typeof getAccessibilitySettings>;
  onPress: () => void;
}) {
  const isAccepted = caregiver.status === "accepted";
  const canReceiveSafetyAlert =
    caregiver.permissions.notifySafetyWarnings ||
    caregiver.permissions.notifyBlockedAttempts;
  const phone = caregiver.caregiver.contactPhoneNumber;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <GlassCard
        style={[
          styles.caregiverCard,
          settings.highContrast && styles.caregiverCardContrast,
        ]}
      >
        <View style={styles.caregiverAvatar}>
          <Ionicons name="person" size={24} color={palette.white} />
        </View>
        <View style={styles.caregiverCopy}>
          <View style={styles.caregiverTopRow}>
            <Text
              style={[
                styles.caregiverName,
                {
                  fontSize:
                    typography.lead + Math.round((settings.fontScale - 1) * 10),
                },
              ]}
            >
              {caregiver.caregiver.fullName}
            </Text>
            <StatusChip
              label={isAccepted ? "Đã kết nối" : "Đang chờ"}
              icon={isAccepted ? "checkmark-circle" : "time"}
              tone={isAccepted ? "primary" : "amber"}
            />
          </View>
          <Text
            style={[
              styles.caregiverMeta,
              {
                fontSize:
                  typography.small + Math.round((settings.fontScale - 1) * 10),
              },
            ]}
          >
            {caregiver.relationship ?? "Người hỗ trợ"}
            {phone ? " · " + phone : " · Chưa có số điện thoại"}
          </Text>
          <View style={styles.permissionRow}>
            <StatusChip
              label={
                canReceiveSafetyAlert
                  ? "Nhận cảnh báo an toàn"
                  : "Chưa bật cảnh báo"
              }
              icon={
                canReceiveSafetyAlert ? "notifications" : "notifications-off"
              }
              tone={canReceiveSafetyAlert ? "blue" : "rose"}
            />
            <StatusChip
              label="Xem chi tiết"
              icon="chevron-forward"
              tone="primary"
            />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function CaregiverDetailModal({
  caregiver,
  settings,
  onClose,
}: {
  caregiver: CaregiverForPatient | null;
  settings: ReturnType<typeof getAccessibilitySettings>;
  onClose: () => void;
}) {
  const phone = caregiver?.caregiver.contactPhoneNumber ?? null;
  const conditions = getProfileTags(caregiver?.caregiver.conditions ?? []);
  const allergies = getProfileTags(caregiver?.caregiver.allergies ?? []);

  return (
    <Modal
      visible={Boolean(caregiver)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalSheet,
            settings.highContrast && styles.modalSheetContrast,
          ]}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.detailAvatar}>
              <Ionicons name="person" size={28} color={palette.white} />
            </View>
            <View style={styles.modalTitleCopy}>
              <Text
                style={[
                  styles.modalTitle,
                  { fontSize: 22 + Math.round((settings.fontScale - 1) * 10) },
                ]}
              >
                {caregiver?.caregiver.fullName ?? "Người hỗ trợ"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {caregiver?.relationship ?? "Người hỗ trợ"}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            <View style={styles.detailActionRow}>
              <Pressable
                accessibilityRole="button"
                disabled={!phone}
                onPress={() => phone && callPhoneNumber(phone)}
                style={({ pressed }) => [
                  styles.callButton,
                  !phone && styles.callButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color={phone ? palette.white : palette.muted}
                />
                <Text
                  style={[
                    styles.callButtonText,
                    !phone && styles.callButtonTextDisabled,
                  ]}
                >
                  {phone ? "Gọi ngay" : "Chưa có số điện thoại"}
                </Text>
              </Pressable>
              <StatusChip
                label={formatCaregiverStatus(caregiver?.status)}
                icon={
                  caregiver?.status === "accepted" ? "checkmark-circle" : "time"
                }
                tone={caregiver?.status === "accepted" ? "primary" : "amber"}
                style={styles.detailStatusChip}
              />
            </View>

            <View style={styles.detailGrid}>
              <InfoTile
                label="Số điện thoại"
                value={phone ?? "Chưa có"}
                icon="call"
              />
              <InfoTile
                label="Tuổi / nhóm tuổi"
                value={caregiver?.caregiver.ageGroup ?? "Chưa có"}
                icon="calendar"
              />
              <InfoTile
                label="Chế độ hiển thị"
                value={formatAccessibilityMode(
                  caregiver?.caregiver.accessibilityMode,
                )}
                icon="accessibility"
              />
              <InfoTile
                label="Ngày kết nối"
                value={formatDate(
                  caregiver?.acceptedAt ?? caregiver?.createdAt,
                )}
                icon="link"
              />
            </View>

            <DetailSection title="Quyền cảnh báo">
              <View style={styles.permissionGrid}>
                <PermissionChip
                  enabled={Boolean(caregiver?.permissions.notifySafetyWarnings)}
                  label="Cảnh báo an toàn"
                />
                <PermissionChip
                  enabled={Boolean(
                    caregiver?.permissions.notifyBlockedAttempts,
                  )}
                  label="Lần kiểm tra bị chặn"
                />
                <PermissionChip
                  enabled={Boolean(caregiver?.permissions.notifyMissedDose)}
                  label="Quên liều"
                />
                <PermissionChip
                  enabled={Boolean(caregiver?.permissions.viewMedicationList)}
                  label="Xem danh sách thuốc"
                />
                <PermissionChip
                  enabled={Boolean(caregiver?.permissions.viewIntakeHistory)}
                  label="Xem lịch sử uống"
                />
              </View>
            </DetailSection>

            <DetailSection title="Tình trạng sức khỏe của caregiver">
              <TagList
                emptyLabel="Chưa có bệnh nền được lưu"
                tags={conditions}
                tone="blue"
              />
            </DetailSection>

            <DetailSection title="Dị ứng đã lưu">
              <TagList
                emptyLabel="Chưa có dị ứng được lưu"
                tags={allergies}
                tone="rose"
              />
            </DetailSection>

            {caregiver?.caregiver.doctorNote ? (
              <DetailSection title="Ghi chú bác sĩ">
                <Text
                  style={[
                    styles.doctorNote,
                    {
                      fontSize:
                        typography.body +
                        Math.round((settings.fontScale - 1) * 10),
                    },
                  ]}
                >
                  {caregiver.caregiver.doctorNote}
                </Text>
              </DetailSection>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ThemePreview({
  mode,
  settings,
}: {
  mode: ModeOption;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <GlassCard
      style={[
        styles.themePreview,
        settings.highContrast && styles.themePreviewContrast,
      ]}
    >
      <View
        style={[
          styles.themePreviewIcon,
          settings.highContrast && styles.themePreviewIconContrast,
        ]}
      >
        <Ionicons
          name={mode.icon}
          size={24}
          color={settings.highContrast ? palette.white : palette.primary}
        />
      </View>
      <View style={styles.themePreviewCopy}>
        <Text
          style={[
            styles.themePreviewTitle,
            {
              fontSize:
                typography.lead + Math.round((settings.fontScale - 1) * 10),
            },
            settings.highContrast && styles.themePreviewTextContrast,
          ]}
        >
          {mode.sampleTitle}
        </Text>
        <Text
          style={[
            styles.themePreviewBody,
            {
              fontSize:
                typography.small + Math.round((settings.fontScale - 1) * 10),
            },
            settings.highContrast && styles.themePreviewBodyContrast,
          ]}
        >
          {mode.sampleBody}
        </Text>
      </View>
    </GlassCard>
  );
}

function NotificationRow({
  notification,
  settings,
}: {
  notification: NotificationEvent;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  const tone =
    notification.status === "sent"
      ? "primary"
      : notification.status === "failed"
        ? "rose"
        : "amber";

  return (
    <GlassCard style={styles.notificationRow}>
      <View style={styles.notificationIcon}>
        <Ionicons name="notifications" size={19} color={palette.primary} />
      </View>
      <View style={styles.notificationCopy}>
        <Text
          style={[
            styles.notificationTitle,
            {
              fontSize:
                typography.body + Math.round((settings.fontScale - 1) * 10),
            },
          ]}
        >
          {notification.title}
        </Text>
        <Text
          style={[
            styles.notificationBody,
            {
              fontSize:
                typography.small + Math.round((settings.fontScale - 1) * 10),
            },
          ]}
        >
          {notification.body}
        </Text>
      </View>
      <StatusChip label={notification.status} icon="ellipse" tone={tone} />
    </GlassCard>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: IconName;
}) {
  return (
    <View style={styles.infoTile}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <Text style={styles.infoTileLabel}>{label}</Text>
      <Text style={styles.infoTileValue}>{value}</Text>
    </View>
  );
}

function PermissionChip({
  enabled,
  label,
}: {
  enabled: boolean;
  label: string;
}) {
  return (
    <View
      style={[
        styles.permissionChip,
        enabled ? styles.permissionChipEnabled : styles.permissionChipDisabled,
      ]}
    >
      <Ionicons
        name={enabled ? "checkmark-circle" : "close-circle"}
        size={16}
        color={enabled ? palette.primary : palette.muted}
      />
      <Text
        style={[
          styles.permissionText,
          !enabled && styles.permissionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function TagList({
  emptyLabel,
  tags,
  tone,
}: {
  emptyLabel: string;
  tags: string[];
  tone: "blue" | "rose";
}) {
  if (!tags.length) {
    return <Text style={styles.emptyTagText}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.tagList}>
      {tags.map((tag) => (
        <View
          key={tag}
          style={[
            styles.tag,
            tone === "rose" ? styles.tagRose : styles.tagBlue,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              tone === "rose" ? styles.tagTextRose : styles.tagTextBlue,
            ]}
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

function getProfileTags(items: unknown[]): string[] {
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = item as { label?: unknown; name?: unknown };
        if (typeof record.label === "string") return record.label;
        if (typeof record.name === "string") return record.name;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item));
}

function callPhoneNumber(phone: string): void {
  Linking.openURL("tel:" + phone).catch((error) => {
    console.warn("Cannot open phone dialer:", error);
  });
}

function formatDate(value?: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có";
  return date.toLocaleDateString("vi-VN");
}

function formatCaregiverStatus(status?: string): string {
  if (status === "accepted") return "Đã kết nối";
  if (status === "pending") return "Đang chờ";
  if (status === "revoked") return "Đã hủy";
  if (status === "declined") return "Đã từ chối";
  return "Chưa rõ";
}

function formatAccessibilityMode(mode?: string): string {
  if (mode === "elderly") return "Người lớn tuổi";
  if (mode === "low_vision") return "Thị lực yếu";
  if (mode === "simple") return "Đơn giản";
  return "Bình thường";
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: palette.white,
    fontSize: 26,
    fontWeight: "900",
  },
  profileCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  profileName: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: "900",
  },
  profileNote: {
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: "700",
  },
  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: palette.inkSoft,
    fontSize: typography.body,
    fontWeight: "700",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.roseSoft,
  },
  errorText: {
    flex: 1,
    color: palette.rose,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 19,
  },
  caregiverList: {
    gap: spacing.md,
  },
  caregiverCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  caregiverCardContrast: {
    borderColor: palette.primary,
    borderWidth: 2,
  },
  caregiverAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  caregiverCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  caregiverTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  caregiverName: {
    flex: 1,
    color: palette.ink,
    fontWeight: "900",
    lineHeight: 26,
  },
  caregiverMeta: {
    color: palette.muted,
    fontWeight: "800",
    lineHeight: 21,
  },
  permissionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  modePill: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    flexDirection: "row",
    gap: spacing.xs,
  },
  modePillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  modeText: {
    color: palette.ink,
    fontSize: typography.small,
    fontWeight: "900",
  },
  modeTextActive: {
    color: palette.white,
  },
  themePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  themePreviewContrast: {
    backgroundColor: palette.ink,
    borderColor: palette.primary,
  },
  themePreviewIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  themePreviewIconContrast: {
    backgroundColor: palette.primary,
  },
  themePreviewCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  themePreviewTitle: {
    color: palette.ink,
    fontWeight: "900",
    lineHeight: 25,
  },
  themePreviewBody: {
    color: palette.muted,
    fontWeight: "800",
    lineHeight: 20,
  },
  themePreviewTextContrast: {
    color: palette.white,
  },
  themePreviewBodyContrast: {
    color: palette.mutedLight,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  action: {
    flex: 1,
    minWidth: 148,
  },
  notificationList: {
    gap: spacing.sm,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  notificationIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationCopy: {
    flex: 1,
    gap: 3,
  },
  notificationTitle: {
    color: palette.ink,
    fontWeight: "900",
  },
  notificationBody: {
    color: palette.muted,
    fontWeight: "700",
    lineHeight: 20,
  },
  notificationEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  notificationEmptyText: {
    flex: 1,
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 19,
  },
  cards: {
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11, 31, 58, 0.36)",
  },
  modalSheet: {
    maxHeight: "88%",
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalSheetContrast: {
    backgroundColor: palette.surface,
  },
  modalHandle: {
    width: 54,
    height: 5,
    borderRadius: 999,
    backgroundColor: palette.mutedLight,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  detailAvatar: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  modalTitle: {
    color: palette.ink,
    fontWeight: "900",
    lineHeight: 28,
  },
  modalSubtitle: {
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.mutedLight,
  },
  modalContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  detailActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  callButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  callButtonDisabled: {
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: palette.mutedLight,
  },
  callButtonText: {
    color: palette.white,
    fontSize: typography.body,
    fontWeight: "900",
  },
  callButtonTextDisabled: {
    color: palette.muted,
  },
  detailStatusChip: {
    minHeight: 56,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  infoTile: {
    width: "48%",
    minHeight: 98,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    gap: spacing.xs,
  },
  infoTileLabel: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "900",
  },
  infoTileValue: {
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 21,
  },
  detailSection: {
    gap: spacing.sm,
  },
  detailSectionTitle: {
    color: palette.ink,
    fontSize: typography.lead,
    fontWeight: "900",
  },
  permissionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  permissionChip: {
    minHeight: 40,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
  },
  permissionChipEnabled: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.mutedLight,
  },
  permissionChipDisabled: {
    backgroundColor: palette.surface,
    borderColor: palette.mutedLight,
  },
  permissionText: {
    color: palette.primaryDark,
    fontSize: typography.small,
    fontWeight: "900",
  },
  permissionTextDisabled: {
    color: palette.muted,
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    minHeight: 38,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tagBlue: {
    backgroundColor: palette.blueSoft,
  },
  tagRose: {
    backgroundColor: palette.roseSoft,
  },
  tagText: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  tagTextBlue: {
    color: palette.blue,
  },
  tagTextRose: {
    color: palette.rose,
  },
  emptyTagText: {
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: "800",
    lineHeight: 19,
  },
  doctorNote: {
    color: palette.inkSoft,
    fontWeight: "700",
    lineHeight: 24,
  },
});
