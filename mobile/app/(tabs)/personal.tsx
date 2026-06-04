import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AccentCard, AppButton, EmptyState, MetricTile, SectionTitle, StatusChip, GlassCard } from '@/src/components/PillPalUI';
import { PillPalScreen } from '@/src/components/PillPalScreen';
import { palette, radius, spacing, shadows, typography } from '@/src/theme/pillpal';
import { apiFetch } from '@/src/api/client';

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

interface CatalogItem {
  id: string;
  name: string;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
}

export default function PersonalCabinetScreen() {
  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

  // Load user medications from backend
  const loadMedications = async () => {
    try {
      const data = await apiFetch<UserMedication[]>('/medications');
      setMedications(data || []);
    } catch (error: any) {
      console.error('Failed to load medications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thuốc cá nhân. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedications();
  }, []);

  // Load default/popular catalog items when modal opens
  const loadDefaultCatalog = async () => {
    setIsSearchingCatalog(true);
    try {
      const data = await apiFetch<CatalogItem[]>('/medication-catalogs?limit=6');
      setCatalogItems(data || []);
    } catch (error) {
      console.error('Failed to load default catalogs:', error);
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && searchQuery === '') {
      loadDefaultCatalog();
    }
  }, [isModalOpen, searchQuery]);

  // Debounced search logic for catalogs
  useEffect(() => {
    if (!isModalOpen) return;
    if (searchQuery === '') return;

    setIsSearchingCatalog(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await apiFetch<CatalogItem[]>(
          `/medication-catalogs/search?name=${encodeURIComponent(searchQuery)}`
        );
        setCatalogItems(data || []);
      } catch (error) {
        console.error('Catalog search failed:', error);
      } finally {
        setIsSearchingCatalog(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isModalOpen]);

  // Handle adding medication to cabinet
  const handleAddMedication = async () => {
    if (!selectedCatalogItem) return;

    setIsSubmitting(true);
    try {
      await apiFetch<UserMedication>('/medications', {
        method: 'POST',
        body: JSON.stringify({
          catalogId: selectedCatalogItem.id,
          name: selectedCatalogItem.name,
          activeIngredient: selectedCatalogItem.activeIngredient || '',
          strength: selectedCatalogItem.strength || '',
          dosageForm: selectedCatalogItem.dosageForm || '',
          note: note,
        }),
      });

      // Reload cabinet list
      await loadMedications();

      // Reset modal state
      setIsModalOpen(false);
      setSelectedCatalogItem(null);
      setNote('');
      setSearchQuery('');
      
      Alert.alert('Thành công', 'Đã thêm thuốc vào tủ thuốc cá nhân.');
    } catch (error: any) {
      console.error('Failed to add medication:', error);
      Alert.alert('Thất bại', error.message || 'Lỗi xảy ra khi thêm thuốc. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = medications.filter((m) => m.isActive !== false).length;
  const inactiveCount = medications.filter((m) => m.isActive === false).length;

  return (
    <PillPalScreen
      eyebrow="Personal meds"
      title="Tủ thuốc cá nhân"
      subtitle="Danh sách thuốc đang dùng sẽ là nguồn chính cho lịch uống và kiểm tra trước khi uống."
    >
      <View style={styles.metrics}>
        <MetricTile value={activeCount.toString()} label="Thuốc đang dùng" tone="primary" />
        <MetricTile value={inactiveCount.toString()} label="Đã ngừng" tone="rose" />
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Thêm thuốc cá nhân"
          icon="add-circle"
          style={styles.action}
          onPress={() => setIsModalOpen(true)}
        />
        <AppButton
          label="Tìm trong catalog"
          icon="search"
          variant="light"
          style={styles.action}
          onPress={() => setIsModalOpen(true)}
        />
      </View>

      <SectionTitle title="Thuốc trong tủ của bạn" />

      {isLoading ? (
        <ActivityIndicator size="large" color={palette.primary} style={styles.loader} />
      ) : medications.length === 0 ? (
        <EmptyState
          icon="medkit"
          title="Chưa có thuốc cá nhân"
          body="Thêm thuốc, hoạt chất, hàm lượng và ghi chú để backend có đủ dữ liệu kiểm tra."
          actionLabel="Thêm thuốc ngay"
          onPress={() => setIsModalOpen(true)}
        />
      ) : (
        <View style={styles.medsList}>
          {medications.map((med) => (
            <GlassCard key={med.id} style={styles.medCard}>
              <View style={styles.medHeader}>
                <View style={styles.medIconWrapper}>
                  <Ionicons
                    name="medical"
                    size={22}
                    color={med.isActive !== false ? palette.primary : palette.muted}
                  />
                </View>
                <View style={styles.medMeta}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medActiveIngredient}>
                    {med.activeIngredient || 'Không chứa hoạt chất phụ'}
                  </Text>
                </View>
                <StatusChip
                  label={med.isActive !== false ? 'Đang dùng' : 'Đã ngừng'}
                  icon={med.isActive !== false ? 'checkmark-circle' : 'close-circle'}
                  tone={med.isActive !== false ? 'primary' : 'rose'}
                />
              </View>
              <View style={styles.medDetails}>
                <Text style={styles.detailText}>• Dạng bào chế: {med.dosageForm || 'Chưa rõ'}</Text>
                <Text style={styles.detailText}>• Hàm lượng: {med.strength || 'Chưa rõ'}</Text>
                {med.note ? (
                  <View style={styles.medNoteContainer}>
                    <Ionicons name="document-text-outline" size={16} color={palette.amber} />
                    <Text style={styles.medNoteText}>{med.note}</Text>
                  </View>
                ) : null}
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      <SectionTitle title="Thông tin cần có" />
      <View style={styles.cards}>
        <AccentCard
          icon="flask"
          tone="blue"
          title="Hoạt chất"
          body="Dùng để so khớp dị ứng và hiển thị cảnh báo dễ hiểu khi check an toàn."
        />
        <AccentCard
          icon="document-text"
          tone="amber"
          title="Ghi chú bác sĩ"
          body="Ví dụ: uống sau ăn, cách nhau tối thiểu, hoặc hướng dẫn riêng."
        />
      </View>

      {/* Modern custom add medication modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalOpen}
        onRequestClose={() => {
          setIsModalOpen(false);
          setSelectedCatalogItem(null);
          setNote('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCatalogItem ? 'Nhập ghi chú thuốc' : 'Chọn thuốc từ danh mục'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalOpen(false);
                  setSelectedCatalogItem(null);
                  setNote('');
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={palette.ink} />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {selectedCatalogItem ? (
              /* Step 2: Form to add notes and save medication */
              <View style={styles.stepContainer}>
                <View style={styles.selectedMedPreview}>
                  <View style={styles.previewHeader}>
                    <Ionicons name="medkit" size={28} color="#30a3e6" />
                    <View style={styles.previewMeta}>
                      <Text style={styles.previewName}>{selectedCatalogItem.name}</Text>
                      <Text style={styles.previewDetails}>
                        {selectedCatalogItem.dosageForm} • {selectedCatalogItem.strength}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.previewActiveIngredient}>
                    Hoạt chất: {selectedCatalogItem.activeIngredient || 'Chưa rõ'}
                  </Text>
                  {selectedCatalogItem.manufacturer ? (
                    <Text style={styles.previewManufacturer}>
                      Nhà sản xuất: {selectedCatalogItem.manufacturer}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ghi chú uống thuốc (Ví dụ: Uống sau ăn sáng)</Text>
                  <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={4}
                    placeholder="Nhập ghi chú từ bác sĩ hoặc thời gian uống..."
                    placeholderTextColor="#99a8a3"
                    value={note}
                    onChangeText={setNote}
                  />
                </View>

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSecondary]}
                    onPress={() => setSelectedCatalogItem(null)}
                  >
                    <Text style={[styles.modalBtnText, styles.modalBtnTextSecondary]}>Quay lại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnPrimary, isSubmitting && styles.modalBtnDisabled]}
                    onPress={handleAddMedication}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.modalBtnText}>Thêm vào tủ</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Step 1: Search and list catalog items */
              <View style={styles.stepContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#667872" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm tên thuốc hoặc hoạt chất..."
                    placeholderTextColor="#99a8a3"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery !== '' ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#667872" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <Text style={styles.sectionSubtitle}>
                  {searchQuery === '' ? 'Thuốc phổ biến trong hệ thống' : 'Kết quả tìm kiếm'}
                </Text>

                {isSearchingCatalog ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#30a3e6" />
                  </View>
                ) : catalogItems.length === 0 ? (
                  <View style={styles.noResults}>
                    <Ionicons name="alert-circle-outline" size={40} color={palette.muted} />
                    <Text style={styles.noResultsText}>Không tìm thấy thuốc nào khớp</Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.catalogList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {catalogItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.catalogItem}
                        onPress={() => setSelectedCatalogItem(item)}
                      >
                        <View style={styles.catalogItemIcon}>
                          <Ionicons name="medical" size={20} color="#30a3e6" />
                        </View>
                        <View style={styles.catalogItemInfo}>
                          <Text style={styles.catalogItemName}>{item.name}</Text>
                          <Text style={styles.catalogItemMeta}>
                            {item.dosageForm} • {item.strength} • {item.activeIngredient || 'Chưa rõ'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </PillPalScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  action: {
    flex: 1,
    minWidth: 148,
  },
  cards: {
    gap: spacing.md,
  },
  loader: {
    marginVertical: 40,
  },
  medsList: {
    gap: spacing.md,
  },
  medCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  medIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: palette.canvasStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medMeta: {
    flex: 1,
    gap: 2,
  },
  medName: {
    fontSize: typography.body,
    fontWeight: '900',
    color: palette.ink,
  },
  medActiveIngredient: {
    fontSize: typography.small,
    color: palette.muted,
    fontWeight: '600',
  },
  medDetails: {
    backgroundColor: palette.canvas,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  detailText: {
    fontSize: typography.small,
    color: palette.inkSoft,
    fontWeight: '500',
  },
  medNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surfaceWarm,
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  medNoteText: {
    fontSize: typography.small,
    color: palette.amber,
    fontWeight: '700',
    flex: 1,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 20, 18, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: typography.lead,
    fontWeight: '900',
    color: palette.ink,
  },
  closeButton: {
    padding: 4,
  },
  stepContainer: {
    gap: 16,
  },
  selectedMedPreview: {
    backgroundColor: '#F0F7FC',
    borderRadius: radius.md,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(48, 163, 230, 0.15)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewMeta: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
    color: palette.ink,
  },
  previewDetails: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: '600',
  },
  previewActiveIngredient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#30a3e6',
  },
  previewManufacturer: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.inkSoft,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: palette.mutedLight,
    borderRadius: radius.md,
    backgroundColor: palette.canvas,
    padding: 12,
    fontSize: 15,
    color: palette.ink,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    backgroundColor: '#30a3e6',
  },
  modalBtnSecondary: {
    backgroundColor: palette.canvasStrong,
  },
  modalBtnDisabled: {
    opacity: 0.7,
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBtnTextSecondary: {
    color: palette.inkSoft,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.mutedLight,
    borderRadius: radius.md,
    backgroundColor: palette.canvas,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: palette.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: palette.muted,
    marginTop: 4,
  },
  loaderContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: palette.muted,
    fontWeight: '600',
  },
  catalogList: {
    maxHeight: 320,
  },
  catalogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 35, 31, 0.05)',
    gap: 12,
  },
  catalogItemIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: '#F0F7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogItemInfo: {
    flex: 1,
    gap: 2,
  },
  catalogItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.ink,
  },
  catalogItemMeta: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: '600',
  },
});
