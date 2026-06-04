import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";

import {
  AccentCard,
  AppButton,
  EmptyState,
  GlassCard,
  MetricTile,
  SectionTitle,
} from "@/src/components/PillPalUI";
import { PillPalScreen } from "@/src/components/PillPalScreen";
import { palette, radius, spacing, typography } from "@/src/theme/pillpal";
import { apiFetch } from "@/src/api/client";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserMedication {
  id: string;
  catalogId: string | null;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  note: string | null;
  isActive: boolean;
  imageUrl?: string | null;
}

interface Schedule {
  id: string;
  userMedicationId: string;
  doseAmount: string;
  times: string[];
  timesPerDay: number;
  minIntervalHours?: number;
  instruction?: string;
  isActive?: boolean;
}

interface DailyPlanItem {
  userMedicationId: string;
  scheduleId: string;
  name: string;
  doseAmount: string;
  instruction: string;
  status: "due" | "taken" | "skipped";
}

interface DailyPlanGroup {
  time: string;
  items: DailyPlanItem[];
}

interface DailyPlan {
  date: string;
  groups: DailyPlanGroup[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  // ---------- State ----------
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Today plan
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  // Modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [form, setForm] = useState({
    userMedicationId: "",
    doseAmount: "",
    times: "",
    timesPerDay: "1",
    minIntervalHours: "",
    instruction: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Which tab is active: 'schedules' | 'today'
  const [activeTab, setActiveTab] = useState<"schedules" | "today">("today");

  // ---------- API Calls ----------

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Schedule[]>("/schedules");
      setSchedules(data || []);
    } catch (e) {
      console.error("Failed to fetch schedules", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadUserMeds = useCallback(async () => {
    try {
      const data = await apiFetch<UserMedication[]>("/medications");
      setMedications(data || []);
    } catch (e) {
      console.error("Failed to load user medications", e);
    }
  }, []);

  const loadDailyPlan = useCallback(async () => {
    setPlanLoading(true);
    try {
      const res = await apiFetch<DailyPlan>("/daily-plan/today");
      setDailyPlan(res ?? null);
    } catch (e) {
      console.error("Failed to load daily plan", e);
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
    loadUserMeds();
    loadDailyPlan();
  }, [loadSchedules, loadUserMeds, loadDailyPlan]);

  // ---------- Handlers ----------

  const handleCreate = async () => {
    const timesArray = form.times
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      userMedicationId: form.userMedicationId,
      doseAmount: form.doseAmount,
      times: timesArray,
      timesPerDay: Number(form.timesPerDay),
      minIntervalHours: form.minIntervalHours
        ? Number(form.minIntervalHours)
        : undefined,
      instruction: form.instruction || undefined,
    };
    setSubmitting(true);
    try {
      await apiFetch<Schedule>("/schedules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setModalOpen(false);
      setForm({
        userMedicationId: "",
        doseAmount: "",
        times: "",
        timesPerDay: "1",
        minIntervalHours: "",
        instruction: "",
      });
      await Promise.all([loadSchedules(), loadDailyPlan()]);
    } catch (e) {
      console.error("Create schedule error", e);
      Alert.alert("Lỗi", "Không thể tạo lịch uống. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa lịch uống này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await apiFetch(`/schedules/${id}`, { method: "DELETE" });
            await Promise.all([loadSchedules(), loadDailyPlan()]);
          } catch (e) {
            console.error("Delete schedule error", e);
            Alert.alert("Lỗi", "Không thể xóa lịch uống.");
          }
        },
      },
    ]);
  };

  const handleTogglePause = async (item: Schedule) => {
    try {
      await apiFetch(`/schedules/${item.id}/pause`, { method: "PUT" });
      await Promise.all([loadSchedules(), loadDailyPlan()]);
    } catch (e) {
      console.error("Pause/resume error", e);
      Alert.alert("Lỗi", "Không thể tạm dừng / tiếp tục lịch uống.");
    }
  };

  // ---------- Helpers ----------

  const getMedName = (medId: string): string => {
    const med = medications.find((m) => m.id === medId);
    return med ? med.name : "Thuốc không xác định";
  };

  const activeCount = schedules.filter((s) => s.isActive !== false).length;
  const pausedCount = schedules.filter((s) => s.isActive === false).length;

  // ---------- Render: Schedule card ----------

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    const isActive = item.isActive !== false;
    return (
      <GlassCard style={[styles.card, !isActive && styles.cardPaused]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardMedName}>
              {getMedName(item.userMedicationId)}
            </Text>
            <Text style={styles.cardDose}>{item.doseAmount}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isActive ? styles.badgeActive : styles.badgePaused,
            ]}
          >
            <Text style={styles.statusText}>
              {isActive ? "Đang bật" : "Tạm dừng"}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={palette.muted} />
            <Text style={styles.cardMeta}> {item.times.join(", ")}</Text>
          </View>
          {item.instruction ? (
            <View style={styles.timeRow}>
              <Ionicons
                name="document-text-outline"
                size={14}
                color={palette.muted}
              />
              <Text style={styles.cardMeta}> {item.instruction}</Text>
            </View>
          ) : null}
          <Text style={styles.cardMeta}>
            {item.timesPerDay} lần/ngày
            {item.minIntervalHours ? ` · cách ${item.minIntervalHours}h` : ""}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.pauseBtn]}
            onPress={() => handleTogglePause(item)}
          >
            <Ionicons
              name={isActive ? "pause-circle-outline" : "play-circle-outline"}
              size={18}
              color={palette.primary}
            />
            <Text style={styles.actionLabel}>
              {isActive ? "Tạm dừng" : "Tiếp tục"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            <Text style={[styles.actionLabel, { color: "#e74c3c" }]}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    );
  };

  // ---------- Render: Today plan ----------

  const renderTodayPlan = () => {
    if (planLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={palette.primary}
          style={styles.loader}
        />
      );
    }

    if (!dailyPlan || !dailyPlan.groups || dailyPlan.groups.length === 0) {
      return (
        <EmptyState
          icon="today"
          title="Chưa có kế hoạch hôm nay"
          body="Khi bạn tạo lịch uống thuốc, kế hoạch hôm nay sẽ tự động được sinh ra."
        />
      );
    }

    return (
      <View>
        {dailyPlan.groups.map((group, gi) => (
          <View key={`g-${gi}`} style={styles.planGroup}>
            {/* Time header */}
            <View style={styles.planTimeHeader}>
              <View style={styles.timeDot} />
              <Text style={styles.planTime}>{group.time}</Text>
            </View>
            {/* Items */}
            {group.items.map((item, ii) => {
              const statusColor =
                item.status === "taken"
                  ? "#27ae60"
                  : item.status === "skipped"
                    ? "#e67e22"
                    : palette.primary;
              const statusLabel =
                item.status === "taken"
                  ? "Đã uống"
                  : item.status === "skipped"
                    ? "Bỏ qua"
                    : "Chưa uống";
              return (
                <GlassCard key={`i-${gi}-${ii}`} style={styles.planCard}>
                  <View style={styles.planCardRow}>
                    <View style={styles.planCardInfo}>
                      <Text style={styles.planMedName}>{item.name}</Text>
                      <Text style={styles.planDose}>{item.doseAmount}</Text>
                      {item.instruction ? (
                        <Text style={styles.planInstruction}>
                          {item.instruction}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={[
                        styles.planStatusBadge,
                        { backgroundColor: statusColor + "20" },
                      ]}
                    >
                      <Ionicons
                        name={
                          item.status === "taken"
                            ? "checkmark-circle"
                            : item.status === "skipped"
                              ? "close-circle"
                              : "ellipse-outline"
                        }
                        size={16}
                        color={statusColor}
                      />
                      <Text
                        style={[styles.planStatusText, { color: statusColor }]}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  // ---------- UI ----------
  return (
    <PillPalScreen
      eyebrow="Lịch uống thuốc"
      title="Quản lý lịch uống"
      subtitle="Tạo, quản lý lịch và xem kế hoạch uống thuốc trong ngày."
    >
      {/* Metrics */}
      <View style={styles.metrics}>
        <MetricTile
          value={activeCount.toString()}
          label="Đang bật"
          tone="primary"
        />
        <MetricTile
          value={schedules.length.toString()}
          label="Tổng lịch"
          tone="blue"
        />
        <MetricTile
          value={pausedCount.toString()}
          label="Tạm dừng"
          tone="amber"
        />
      </View>

      {/* Quick actions */}
      <View style={styles.quickPanel}>
        <AppButton
          label="Tạo lịch uống"
          icon="add-circle"
          style={styles.primaryAction}
          onPress={() => setModalOpen(true)}
        />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "today" && styles.tabActive]}
          onPress={() => setActiveTab("today")}
        >
          <Ionicons
            name="today"
            size={16}
            color={activeTab === "today" ? "#fff" : palette.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "today" && styles.tabLabelActive,
            ]}
          >
            Hôm nay
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "schedules" && styles.tabActive]}
          onPress={() => setActiveTab("schedules")}
        >
          <Ionicons
            name="list"
            size={16}
            color={activeTab === "schedules" ? "#fff" : palette.muted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === "schedules" && styles.tabLabelActive,
            ]}
          >
            Tất cả lịch
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "today" ? (
        <>
          <SectionTitle
            title={`Kế hoạch ${dailyPlan?.date || "hôm nay"}`}
            action="Làm mới"
            onAction={loadDailyPlan}
          />
          {renderTodayPlan()}
        </>
      ) : (
        <>
          <SectionTitle
            title="Danh sách lịch uống"
            action="Làm mới"
            onAction={loadSchedules}
          />
          {loading ? (
            <ActivityIndicator
              size="large"
              color={palette.primary}
              style={styles.loader}
            />
          ) : schedules.length === 0 ? (
            <EmptyState
              icon="calendar-clear"
              title="Chưa có lịch uống nào"
              body="Khi bạn thêm thuốc và thời gian uống, lịch sẽ xuất hiện tại đây."
              actionLabel="Thêm lịch"
              onPress={() => setModalOpen(true)}
            />
          ) : (
            <FlatList
              data={schedules}
              keyExtractor={(item) => item.id}
              renderItem={renderScheduleItem}
              contentContainerStyle={styles.listContainer}
              scrollEnabled={false}
            />
          )}
        </>
      )}

      {/* ─── Create Schedule Modal ──────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tạo lịch uống</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close-circle" size={28} color={palette.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Medication picker */}
              <Text style={styles.fieldLabel}>Thuốc</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={form.userMedicationId}
                  onValueChange={(v) =>
                    setForm({ ...form, userMedicationId: v })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="-- Chọn thuốc --" value="" />
                  {medications.map((med) => (
                    <Picker.Item
                      key={med.id}
                      label={`${med.name}${med.strength ? " (" + med.strength + ")" : ""}`}
                      value={med.id}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Liều lượng</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 1 viên, 5ml…"
                placeholderTextColor="#999"
                value={form.doseAmount}
                onChangeText={(v) => setForm({ ...form, doseAmount: v })}
              />

              <Text style={styles.fieldLabel}>
                Thời gian uống (cách nhau bởi dấu phẩy)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 08:00, 20:00"
                placeholderTextColor="#999"
                value={form.times}
                onChangeText={(v) => setForm({ ...form, times: v })}
              />

              <Text style={styles.fieldLabel}>Số lần trong ngày</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 2"
                keyboardType="numeric"
                placeholderTextColor="#999"
                value={form.timesPerDay}
                onChangeText={(v) => setForm({ ...form, timesPerDay: v })}
              />

              <Text style={styles.fieldLabel}>Khoảng cách tối thiểu (giờ)</Text>
              <TextInput
                style={styles.input}
                placeholder="VD: 8"
                keyboardType="numeric"
                placeholderTextColor="#999"
                value={form.minIntervalHours}
                onChangeText={(v) => setForm({ ...form, minIntervalHours: v })}
              />

              <Text style={styles.fieldLabel}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="VD: Uống sau ăn 30 phút"
                placeholderTextColor="#999"
                value={form.instruction}
                onChangeText={(v) => setForm({ ...form, instruction: v })}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.secondaryBtn]}
                onPress={() => setModalOpen(false)}
                disabled={submitting}
              >
                <Text style={styles.secondaryBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.primaryBtn,
                  submitting && styles.disabledBtn,
                ]}
                onPress={handleCreate}
                disabled={submitting || !form.userMedicationId}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Lưu lịch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PillPalScreen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* Metrics & quick actions */
  metrics: { flexDirection: "row", gap: spacing.md },
  quickPanel: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  primaryAction: { flex: 1 },

  /* Tab switcher */
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: palette.canvasStrong,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: palette.primary,
  },
  tabLabel: {
    ...typography.small,
    color: palette.muted,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#fff",
  },

  /* Loader & list */
  loader: { marginVertical: 40 },
  listContainer: { paddingVertical: spacing.sm },

  /* Schedule card */
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.canvas,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: palette.primary,
  },
  cardPaused: {
    opacity: 0.6,
    borderLeftColor: palette.muted,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardInfo: { flex: 1 },
  cardMedName: {
    ...typography.body,
    fontWeight: "800",
    color: palette.ink,
  },
  cardDose: {
    ...typography.small,
    color: palette.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeActive: { backgroundColor: "#27ae6020" },
  badgePaused: { backgroundColor: "#e67e2220" },
  statusText: { fontSize: 11, fontWeight: "700", color: palette.ink },

  cardBody: { marginBottom: 8 },
  timeRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  cardMeta: { ...typography.small, color: palette.muted },

  cardActions: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: palette.mutedLight ?? "#eee",
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  pauseBtn: { backgroundColor: palette.primary + "12" },
  deleteBtn: { backgroundColor: "#e74c3c12" },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.primary,
  },

  /* ─── Today plan ──────────────────────────────────────────────── */
  planGroup: { marginBottom: spacing.md },
  planTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  timeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primary,
  },
  planTime: {
    ...typography.body,
    fontWeight: "900",
    color: palette.ink,
  },
  planCard: {
    padding: spacing.md,
    marginBottom: spacing.xs,
    marginLeft: 18,
    borderRadius: radius.md,
    backgroundColor: palette.canvas,
    borderLeftWidth: 3,
    borderLeftColor: palette.primary + "60",
  },
  planCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planCardInfo: { flex: 1 },
  planMedName: { ...typography.body, fontWeight: "700", color: palette.ink },
  planDose: { ...typography.small, color: palette.primary, fontWeight: "600" },
  planInstruction: { ...typography.small, color: palette.muted, marginTop: 2 },
  planStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planStatusText: { fontSize: 11, fontWeight: "700" },

  /* ─── Modal ───────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "92%",
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: palette.ink,
  },
  modalScroll: { marginBottom: spacing.md },
  fieldLabel: {
    ...typography.small,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 4,
    marginTop: 8,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: palette.mutedLight ?? "#ddd",
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.mutedLight ?? "#ddd",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    color: palette.ink,
    fontSize: 15,
  },
  inputMultiline: {
    textAlignVertical: "top",
    minHeight: 70,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: { backgroundColor: palette.primary },
  secondaryBtn: { backgroundColor: palette.canvasStrong },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryBtnText: { color: palette.ink, fontWeight: "700", fontSize: 15 },
});
