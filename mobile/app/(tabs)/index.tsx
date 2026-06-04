import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MedicationScanCandidate,
  MedicationScanResult,
  ScanImageAsset,
  scanMedicationByStaticId,
  uploadMedicationImage,
} from '@/src/api/scan.api';
import { runSafetyCheck, SafetyCheckResult, SafetyReason } from '@/src/api/safety.api';
import {
  getAccessibilitySettings,
  scaleFont,
  scaleSpace,
  useAccessibilityStore,
} from '@/src/store/accessibility';
import { palette, radius, shadows, spacing, typography } from '@/src/theme/pillpal';

type ScanStage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';
type SafetyStage = 'idle' | 'checking' | 'done' | 'error';

const blue = {
  bg: palette.canvas,
  surface: palette.surface,
  surfaceSoft: palette.primarySoft,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  sky: '#38BDF8',
  border: palette.mutedLight,
  ink: palette.ink,
  muted: palette.muted,
  muted2: palette.inkSoft,
  danger: palette.rose,
  dangerSoft: palette.roseSoft,
  white: palette.white,
};

export default function ScanScreen() {
  const cameraRef = useRef<CameraView>(null);
  const scanLine = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ScanImageAsset | null>(null);
  const [scanResult, setScanResult] = useState<MedicationScanResult | null>(null);
  const [safetyResult, setSafetyResult] = useState<SafetyCheckResult | null>(null);
  const [safetyStage, setSafetyStage] = useState<SafetyStage>('idle');
  const [stage, setStage] = useState<ScanStage>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [safetyErrorMessage, setSafetyErrorMessage] = useState<string | null>(null);
  const settings = getAccessibilitySettings(useAccessibilityStore((state) => state.mode));

  const isBusy = stage === 'uploading' || stage === 'analyzing';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [scanLine]);

  async function openCamera() {
    setErrorMessage(null);
    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) {
        setErrorMessage('PillPal cần quyền camera để quét ảnh thuốc.');
        return;
      }
    }

    setCameraOpen(true);
    setCameraReady(false);
  }

  async function pickImage() {
    setErrorMessage(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.88,
    });

    if (result.canceled || !result.assets[0]) return;

    await runScan({
      uri: result.assets[0].uri,
      fileName: result.assets[0].fileName,
      mimeType: result.assets[0].mimeType,
    });
  }

  async function captureImage() {
    if (!cameraRef.current || !cameraReady || isBusy) return;

    setErrorMessage(null);
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.86,
      base64: false,
    });

    if (!photo?.uri) {
      setErrorMessage('Không chụp được ảnh. Vui lòng thử lại.');
      return;
    }

    setCameraOpen(false);
    await runScan({
      uri: photo.uri,
      fileName: `pillpal-camera-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
    });
  }

  async function runScan(asset: ScanImageAsset) {
    try {
      setSelectedImage(asset);
      setScanResult(null);
      setSafetyResult(null);
      setSafetyStage('idle');
      setErrorMessage(null);
      setSafetyErrorMessage(null);
      setStage('uploading');
      const upload = await uploadMedicationImage(asset);

      setStage('analyzing');
      const scan = await scanMedicationByStaticId(upload.staticId);

      setScanResult(scan);
      setStage('done');
    } catch (error) {
      setStage('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể quét thuốc lúc này. Vui lòng thử lại.',
      );
    }
  }


  async function runSafetyCheckForCandidate(candidate: MedicationScanCandidate | undefined) {
    setSafetyErrorMessage(null);

    if (!candidate?.userMedicationId) {
      setSafetyStage('error');
      setSafetyErrorMessage('Thuốc này chưa khớp với tủ thuốc cá nhân. Vui lòng chọn thuốc thủ công trước khi kiểm tra an toàn.');
      return;
    }

    try {
      setSafetyStage('checking');
      const result = await runSafetyCheck({
        userMedicationId: candidate.userMedicationId,
        scheduleId: null,
        scheduledTime: null,
        source: 'scan',
      });
      setSafetyResult(result);
      setSafetyStage('done');
    } catch (error) {
      setSafetyStage('error');
      setSafetyErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kiểm tra an toàn lúc này. Vui lòng thử lại.',
      );
    }
  }

  const scanLineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [-96, 96],
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.safeAreaContrast]}
      edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: settings.screenPadding,
            paddingTop: scaleSpace(spacing.lg, settings),
            paddingBottom: settings.tabBarHeight + 42,
            gap: scaleSpace(spacing.lg, settings),
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="scan" size={24} color={blue.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { fontSize: scaleFont(24, settings) }]}>Kiểm tra thuốc</Text>
          </View>
        </View>

        <View style={[styles.cameraCard, settings.highContrast && styles.cardContrast]}>
          <View
            style={[
              styles.cameraStage,
              { height: settings.simplified ? 280 : Math.round(330 * settings.spacingScale) },
            ]}>
            {cameraOpen ? (
              <CameraView
                ref={cameraRef}
                style={styles.cameraView}
                facing="back"
                mode="picture"
                animateShutter
                onCameraReady={() => setCameraReady(true)}
              />
            ) : selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.cameraView} contentFit="cover" />
            ) : (
              <View style={styles.placeholder}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="camera-outline" size={36} color={blue.primary} />
                </View>
                <Text style={[styles.placeholderTitle, { fontSize: scaleFont(typography.lead, settings) }]}>Đưa thuốc vào khung</Text>
                {settings.showSecondaryText ? (
                  <Text style={[styles.placeholderText, { fontSize: scaleFont(typography.small, settings) }]}>
                    Nền sáng, không rung tay, chữ trên thuốc nằm trong vùng quét.
                  </Text>
                ) : null}
              </View>
            )}

            <View pointerEvents="none" style={styles.scanOverlay}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />
                <Animated.View style={[styles.scanBeam, { transform: [{ translateY: scanLineTranslate }] }]} />
              </View>
            </View>

            <View style={styles.statusBadge}>
              {isBusy ? <ActivityIndicator size="small" color={blue.primary} /> : <Ionicons name="sparkles" size={15} color={blue.primary} />}
              <Text style={styles.statusBadgeText}>{getStageLabel(stage)}</Text>
            </View>
          </View>

          {cameraOpen ? (
            <View style={styles.cameraControls}>
              <ActionButton label="Hủy" icon="close" variant="light" onPress={() => setCameraOpen(false)} disabled={isBusy} />
              <Pressable
                accessibilityRole="button"
                disabled={!cameraReady || isBusy}
                onPress={captureImage}
                style={({ pressed }) => [
                  styles.shutterButton,
                  (!cameraReady || isBusy) && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                {isBusy ? <ActivityIndicator color={blue.white} /> : <View style={styles.shutterInner} />}
              </Pressable>
              <ActionButton label="Ảnh" icon="image" variant="light" onPress={pickImage} disabled={isBusy} />
            </View>
          ) : (
            <View style={styles.actionRow}>
              <ActionButton label="Mở camera" icon="camera" onPress={openCamera} disabled={isBusy} />
              <ActionButton label="Chọn ảnh" icon="image" variant="light" onPress={pickImage} disabled={isBusy} />
            </View>
          )}
        </View>

        {!settings.simplified ? (
          <View style={styles.tipsRow}>
            <Tip icon="sunny" label="Đủ sáng" settings={settings} />
            <Tip icon="text" label="Thấy rõ chữ" settings={settings} />
            <Tip icon="hand-left" label="Giữ yên" settings={settings} />
          </View>
        ) : null}

        {isBusy ? <ProgressCard stage={stage} settings={settings} /> : null}
        {errorMessage ? <ErrorCard message={errorMessage} settings={settings} /> : null}
        {scanResult ? (
          <ScanResultCard
            result={scanResult}
            safetyResult={safetyResult}
            safetyStage={safetyStage}
            safetyErrorMessage={safetyErrorMessage}
            onRunSafetyCheck={runSafetyCheckForCandidate}
            settings={settings}
          />
        ) : (
          <WaitingCard settings={settings} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStageLabel(stage: ScanStage): string {
  if (stage === 'uploading') return 'Đang tải ảnh';
  if (stage === 'analyzing') return 'Đang nhận diện';
  if (stage === 'done') return 'Đã có kết quả';
  if (stage === 'error') return 'Cần thử lại';
  return 'Sẵn sàng';
}

function ActionButton({
  label,
  icon,
  variant = 'primary',
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'light';
  disabled?: boolean;
  onPress: () => void;
}) {
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        primary ? styles.actionPrimary : styles.actionLight,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={19} color={primary ? blue.white : blue.primary} />
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : styles.actionTextLight]}>{label}</Text>
    </Pressable>
  );
}

function Tip({
  icon,
  label,
  settings,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <View style={styles.tipPill}>
      <Ionicons name={icon} size={15} color={blue.primary} />
      <Text style={[styles.tipText, { fontSize: scaleFont(12, settings) }]}>{label}</Text>
    </View>
  );
}

function ProgressCard({
  stage,
  settings,
}: {
  stage: ScanStage;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <View style={styles.infoCard}>
      <ActivityIndicator color={blue.primary} />
      <View style={styles.infoCopy}>
        <Text style={[styles.infoTitle, { fontSize: scaleFont(typography.lead, settings) }]}>{stage === 'uploading' ? 'Đang tải ảnh lên' : 'Đang nhận diện thuốc'}</Text>
        <Text style={[styles.infoText, { fontSize: scaleFont(typography.small, settings) }]}>Quá trình này thường chỉ mất vài giây. Vui lòng giữ màn hình mở.</Text>
      </View>
    </View>
  );
}

function ErrorCard({
  message,
  settings,
}: {
  message: string;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <View style={[styles.infoCard, styles.errorCard]}>
      <View style={styles.errorIcon}>
        <Ionicons name="warning" size={20} color={blue.danger} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.errorTitle, { fontSize: scaleFont(typography.lead, settings) }]}>Chưa quét được ảnh</Text>
        <Text style={[styles.infoText, { fontSize: scaleFont(typography.small, settings) }]}>{message}</Text>
      </View>
    </View>
  );
}

function WaitingCard({ settings }: { settings: ReturnType<typeof getAccessibilitySettings> }) {
  return (
    <View style={styles.waitingCard}>
      <View style={styles.waitingIcon}>
        <Ionicons name="document-text-outline" size={22} color={blue.primary} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={styles.waitingTitle}>Thông tin thuốc sẽ hiện ở đây</Text>
        <Text style={[styles.infoText, { fontSize: scaleFont(typography.small, settings) }]}>Sau khi quét, PillPal sẽ hiển thị tên thuốc, hoạt chất, hàm lượng và mức độ khớp.</Text>
      </View>
    </View>
  );
}

function ScanResultCard({
  result,
  safetyResult,
  safetyStage,
  safetyErrorMessage,
  onRunSafetyCheck,
  settings,
}: {
  result: MedicationScanResult;
  safetyResult: SafetyCheckResult | null;
  safetyStage: SafetyStage;
  safetyErrorMessage: string | null;
  onRunSafetyCheck: (candidate: MedicationScanCandidate | undefined) => void;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  const bestCandidate = result.candidates[0];
  const displayName = bestCandidate?.name ?? result.extractedData.name ?? 'Chưa đọc được tên thuốc';

  return (
    <View style={[styles.resultCard, settings.highContrast && styles.cardContrast]}>
      <View style={styles.resultTopRow}>
        <View style={styles.resultBadge}>
          <Ionicons name="shield-checkmark" size={16} color={blue.primary} />
          <Text style={styles.resultBadgeText}>Cần xác nhận</Text>
        </View>
      </View>

      <Text style={[styles.resultTitle, { fontSize: scaleFont(18, settings) }]}>Dựa trên hình ảnh, thuốc có thể là:</Text>
      <Text style={[styles.resultName, { fontSize: scaleFont(28, settings) }]}>{displayName}</Text>
      {settings.showSecondaryText ? (
        <Text style={[styles.resultHint, { fontSize: scaleFont(14, settings) }]}>
          Vui lòng xác nhận trước khi tiếp tục kiểm tra an toàn.
        </Text>
      ) : null}

      {bestCandidate ? <CandidateCard candidate={bestCandidate} settings={settings} /> : <NoCandidate settings={settings} />}

      <View style={styles.detailGrid}>
        <InfoTile label="Hoạt chất" value={result.extractedData.activeIngredient} settings={settings} />
        <InfoTile label="Hàm lượng" value={result.extractedData.strength} settings={settings} />
        <InfoTile label="Dạng thuốc" value={result.extractedData.dosageForm} settings={settings} />
        <InfoTile
          label="Độ tin cậy"
          value={`${Math.round((bestCandidate?.confidence ?? result.extractedData.confidence) * 100)}%`}
          settings={settings}
        />
      </View>

      {safetyStage === 'checking' ? <SafetyProgressCard settings={settings} /> : null}
      {safetyErrorMessage ? <SafetyErrorCard message={safetyErrorMessage} settings={settings} /> : null}
      {safetyResult ? <SafetyResultCard result={safetyResult} settings={settings} /> : null}

      <View style={styles.resultActions}>
        <ActionButton
          label={safetyStage === 'checking' ? 'Đang kiểm tra' : 'Đúng, kiểm tra an toàn'}
          icon="checkmark-circle"
          onPress={() => onRunSafetyCheck(bestCandidate)}
          disabled={safetyStage === 'checking'}
        />
        <ActionButton
          label="Chọn thuốc khác"
          icon="list"
          variant="light"
          onPress={() => onRunSafetyCheck(undefined)}
          disabled={safetyStage === 'checking'}
        />
      </View>
    </View>
  );
}

function SafetyProgressCard({ settings }: { settings: ReturnType<typeof getAccessibilitySettings> }) {
  return (
    <View style={styles.safetyInfoCard}>
      <ActivityIndicator color={blue.primary} />
      <View style={styles.infoCopy}>
        <Text style={[styles.infoTitle, { fontSize: scaleFont(typography.lead, settings) }]}>Đang kiểm tra an toàn</Text>
        <Text style={[styles.infoText, { fontSize: scaleFont(typography.small, settings) }]}>Backend đang chạy rule engine và sẽ gửi cảnh báo cho caregiver nếu có rủi ro.</Text>
      </View>
    </View>
  );
}

function SafetyErrorCard({ message, settings }: { message: string; settings: ReturnType<typeof getAccessibilitySettings> }) {
  return (
    <View style={[styles.safetyInfoCard, styles.errorCard]}>
      <View style={styles.errorIcon}>
        <Ionicons name="warning" size={20} color={blue.danger} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.errorTitle, { fontSize: scaleFont(typography.lead, settings) }]}>Chưa thể kiểm tra an toàn</Text>
        <Text style={[styles.infoText, { fontSize: scaleFont(typography.small, settings) }]}>{message}</Text>
      </View>
    </View>
  );
}

function SafetyResultCard({
  result,
  settings,
}: {
  result: SafetyCheckResult;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  const tone = getSafetyTone(result.result);
  const label = getSafetyLabel(result.result);

  return (
    <View style={[styles.safetyResultCard, safetyResultStyles[tone]]}>
      <View style={styles.safetyResultHeader}>
        <View style={[styles.safetyIcon, safetyIconStyles[tone]]}>
          <Ionicons name={getSafetyIcon(result.result)} size={22} color={safetyTextColors[tone]} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={[styles.safetyTitle, { color: safetyTextColors[tone] }]}>{label}</Text>
          <Text style={styles.safetyMeta}>
            {result.result === 'allowed'
              ? 'Không cần gửi cảnh báo caregiver.'
              : 'Backend đã tạo notification cho caregiver phù hợp nếu họ có push token.'}
          </Text>
        </View>
      </View>

      {result.reasons.length ? (
        <View style={styles.reasonList}>
          {result.reasons.map((reason) => (
            <SafetyReasonRow key={reason.code + reason.message} reason={reason} />
          ))}
        </View>
      ) : (
        <Text style={styles.safetyMeta}>Không có cảnh báo bổ sung.</Text>
      )}

      {result.suggestedAction ? <Text style={styles.suggestedAction}>{result.suggestedAction}</Text> : null}
    </View>
  );
}

function SafetyReasonRow({ reason }: { reason: SafetyReason }) {
  return (
    <View style={styles.reasonRow}>
      <Ionicons
        name={reason.severity === 'blocked' ? 'stop-circle' : 'alert-circle'}
        size={18}
        color={reason.severity === 'blocked' ? blue.danger : palette.amber}
      />
      <Text style={styles.reasonText}>{reason.message}</Text>
    </View>
  );
}

function getSafetyTone(status: SafetyCheckResult['result']): 'allowed' | 'warning' | 'blocked' {
  if (status === 'blocked') return 'blocked';
  if (status === 'warning') return 'warning';
  return 'allowed';
}

function getSafetyLabel(status: SafetyCheckResult['result']): string {
  if (status === 'blocked') return 'Không nên xác nhận uống lúc này';
  if (status === 'warning') return 'Cần chú ý trước khi uống';
  return 'Có thể uống theo lịch';
}

function getSafetyIcon(status: SafetyCheckResult['result']): keyof typeof Ionicons.glyphMap {
  if (status === 'blocked') return 'stop-circle';
  if (status === 'warning') return 'warning';
  return 'shield-checkmark';
}

function CandidateCard({
  candidate,
  settings,
}: {
  candidate: MedicationScanCandidate;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <View style={styles.candidateCard}>
      <View style={styles.candidateIcon}>
        <Ionicons name="medkit" size={21} color={blue.primary} />
      </View>
      <View style={styles.candidateBody}>
        <Text style={[styles.candidateName, { fontSize: scaleFont(typography.lead, settings) }]}>{candidate.name}</Text>
        <Text style={[styles.candidateMeta, { fontSize: scaleFont(typography.small, settings) }]}>
          {[candidate.activeIngredient, candidate.strength, candidate.dosageForm].filter(Boolean).join(' · ') || 'Chưa đủ thông tin'}
        </Text>
      </View>
      <Text style={styles.confidenceText}>{Math.round(candidate.confidence * 100)}%</Text>
    </View>
  );
}

function NoCandidate({ settings }: { settings: ReturnType<typeof getAccessibilitySettings> }) {
  return (
    <View style={styles.noCandidateBox}>
      <Ionicons name="alert-circle-outline" size={20} color={blue.primary} />
      <Text style={[styles.noCandidateText, { fontSize: scaleFont(typography.small, settings) }]}>Nếu kết quả chưa chính xác, bạn vui lòng chọn hình ảnh từ thiết bị.</Text>
    </View>
  );
}

function InfoTile({
  label,
  value,
  settings,
}: {
  label: string;
  value: string | null;
  settings: ReturnType<typeof getAccessibilitySettings>;
}) {
  return (
    <View style={styles.infoTile}>
      <Text style={[styles.infoLabel, { fontSize: scaleFont(12, settings) }]}>{label}</Text>
      <Text style={[styles.infoValue, { fontSize: scaleFont(typography.body, settings) }]}>{value ?? 'Chưa có'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: blue.bg,
  },
  safeAreaContrast: {
    backgroundColor: blue.white,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  headerCopy: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    color: blue.primary,
    fontSize: typography.eyebrow,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: blue.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: blue.muted,
    fontSize: typography.body,
    fontWeight: '600',
  },
  cardContrast: {
    borderColor: blue.primary,
    borderWidth: 2,
  },
  cameraCard: {
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: blue.border,
    gap: spacing.md,
    ...shadows.lift,
  },
  cameraStage: {
    height: 330,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: blue.surfaceSoft,
  },
  cameraView: {
    flex: 1,
    backgroundColor: blue.surfaceSoft,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    color: blue.ink,
    fontSize: typography.lead,
    fontWeight: '900',
    textAlign: 'center',
  },
  placeholderText: {
    color: blue.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
    textAlign: 'center',
  },
  scanOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '74%',
    height: '62%',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: blue.primary,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: radius.sm,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: radius.sm,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: radius.sm,
  },
  cornerBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: radius.sm,
  },
  scanBeam: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '50%',
    height: 3,
    borderRadius: 999,
    backgroundColor: blue.sky,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    minHeight: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusBadgeText: {
    color: blue.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionPrimary: {
    backgroundColor: blue.primary,
  },
  actionLight: {
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
  },
  actionText: {
    fontSize: typography.body,
    fontWeight: '900',
    textAlign: 'center',
  },
  actionTextPrimary: {
    color: blue.white,
  },
  actionTextLight: {
    color: blue.primary,
  },
  cameraControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  shutterButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: blue.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 7,
    borderColor: blue.white,
    ...shadows.card,
  },
  shutterInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: blue.white,
  },
  disabled: {
    opacity: 0.56,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  tipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tipPill: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tipText: {
    color: blue.primaryDark,
    fontSize: 12,
    fontWeight: '900',
  },
  infoCard: {
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  infoTitle: {
    color: blue.ink,
    fontSize: typography.lead,
    fontWeight: '900',
  },
  infoText: {
    color: blue.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  errorCard: {
    backgroundColor: blue.dangerSoft,
    borderColor: '#FFD0CB',
  },
  errorIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: blue.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: blue.danger,
    fontSize: typography.lead,
    fontWeight: '900',
  },
  waitingCard: {
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  waitingIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: blue.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingTitle: {
    color: blue.ink,
    fontSize: typography.lead,
    fontWeight: '900',
  },
  resultCard: {
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  resultBadge: {
    minHeight: 36,
    borderRadius: radius.md,
    backgroundColor: blue.surfaceSoft,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultBadgeText: {
    color: blue.primary,
    fontSize: typography.small,
    fontWeight: '900',
  },
  sourceText: {
    color: blue.muted2,
    fontSize: 12,
    fontWeight: '900',
  },
  resultTitle: {
    color: blue.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 30,
  },
  resultName: {
    color: blue.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  resultHint: {
    color: blue.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  candidateCard: {
    borderRadius: radius.md,
    backgroundColor: blue.surfaceSoft,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  candidateIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: blue.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateBody: {
    flex: 1,
    gap: 3,
  },
  candidateName: {
    color: blue.ink,
    fontSize: typography.lead,
    fontWeight: '900',
  },
  candidateMeta: {
    color: blue.muted,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 18,
  },
  confidenceText: {
    color: blue.primary,
    fontSize: typography.body,
    fontWeight: '900',
  },
  noCandidateBox: {
    borderRadius: radius.md,
    backgroundColor: blue.surfaceSoft,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noCandidateText: {
    flex: 1,
    color: blue.ink,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoTile: {
    width: '48%',
    minHeight: 72,
    borderRadius: radius.md,
    backgroundColor: blue.surfaceSoft,
    padding: spacing.md,
    gap: spacing.xs,
  },
  infoLabel: {
    color: blue.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  infoValue: {
    color: blue.ink,
    fontSize: typography.body,
    fontWeight: '900',
    lineHeight: 21,
  },
  safetyInfoCard: {
    borderRadius: radius.lg,
    backgroundColor: blue.surface,
    borderWidth: 1,
    borderColor: blue.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  safetyResultCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  safetyResultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  safetyIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: {
    fontSize: typography.lead,
    fontWeight: '900',
    lineHeight: 24,
  },
  safetyMeta: {
    color: blue.muted,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
  },
  reasonList: {
    gap: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  reasonText: {
    flex: 1,
    color: blue.ink,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
  },
  suggestedAction: {
    color: blue.ink,
    fontSize: typography.small,
    fontWeight: '900',
    lineHeight: 19,
  },
  resultActions: {
    gap: spacing.sm,
  },
});

const safetyResultStyles = StyleSheet.create({
  allowed: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.mutedLight,
  },
  warning: {
    backgroundColor: palette.amberSoft,
    borderColor: '#FFD995',
  },
  blocked: {
    backgroundColor: palette.roseSoft,
    borderColor: '#FFD0CB',
  },
});

const safetyIconStyles = StyleSheet.create({
  allowed: {
    backgroundColor: blue.surface,
  },
  warning: {
    backgroundColor: blue.surface,
  },
  blocked: {
    backgroundColor: blue.surface,
  },
});

const safetyTextColors = {
  allowed: palette.primary,
  warning: palette.amber,
  blocked: palette.rose,
};
