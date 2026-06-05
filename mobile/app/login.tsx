import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useState, type ComponentProps } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as z from 'zod';

import { apiFetch } from '@/src/api/client';
import { useAuthStore } from '@/src/store/auth';
import {
  accessibilityModeOptions,
  getAccessibilitySettings,
  scaleFont,
  scaleSpace,
  type AccessibilityMode,
  useAccessibilityStore,
} from '@/src/store/accessibility';
import { palette, radius, shadows, spacing, typography } from '@/src/theme/pillpal';

const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const loginAccessibilityModes = accessibilityModeOptions.map((mode) => ({
  ...mode,
  icon: mode.icon as IconName,
}));

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const accessibilityMode = useAccessibilityStore((state) => state.mode);
  const setAccessibilityMode = useAccessibilityStore((state) => state.setMode);
  const settings = getAccessibilitySettings(accessibilityMode);

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError(null);

    try {
      const result = await apiFetch<{
        accessToken: string;
        user: { id: string; email: string | null };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!result?.accessToken) {
        throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
      }

      setSession(result.accessToken, result.user);
      router.replace('/(tabs)');
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.safeAreaContrast]}
      edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: settings.screenPadding,
              paddingVertical: scaleSpace(spacing.xxl, settings),
              gap: scaleSpace(spacing.lg, settings),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.brandPanel,
              { padding: settings.cardPadding, gap: scaleSpace(spacing.md, settings) },
              settings.highContrast && styles.panelContrast,
            ]}>
            <View style={styles.logoMark}>
              <Ionicons name="medical" size={34} color={palette.white} />
            </View>
            <View style={styles.brandCopy}>
              {!settings.simplified ? (
                <Text style={[styles.eyebrow, { fontSize: scaleFont(typography.eyebrow, settings) }]}>
                  Medication safety
                </Text>
              ) : null}
              <Text
                style={[
                  styles.brandName,
                  { fontSize: scaleFont(typography.display, settings), lineHeight: scaleFont(40, settings) },
                ]}>
                PillPal
              </Text>
              {settings.showSecondaryText ? (
                <Text
                  style={[
                    styles.subtitle,
                    { fontSize: scaleFont(typography.body, settings), lineHeight: scaleFont(22, settings) },
                  ]}>
                  Kiểm tra đúng thuốc, đúng giờ và đúng liều trước khi uống.
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.modePanel,
              { padding: settings.cardPadding, gap: scaleSpace(spacing.sm, settings) },
              settings.highContrast && styles.panelContrast,
            ]}>
            <Text style={[styles.modeTitle, { fontSize: scaleFont(typography.lead, settings) }]}>
              Chế độ hiển thị
            </Text>
            <View style={styles.modeRow}>
              {loginAccessibilityModes.map((mode) => {
                const isActive = mode.id === accessibilityMode;
                return (
                  <Pressable
                    key={mode.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => setAccessibilityMode(mode.id as AccessibilityMode)}
                    style={({ pressed }) => [
                      styles.modePill,
                      { minHeight: settings.minTapTarget },
                      isActive && styles.modePillActive,
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name={mode.icon} size={scaleFont(18, settings)} color={isActive ? palette.white : palette.primary} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.modeText,
                        { fontSize: scaleFont(typography.small, settings) },
                        isActive && styles.modeTextActive,
                      ]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View
            style={[
              styles.formCard,
              { padding: settings.cardPadding, gap: scaleSpace(spacing.md, settings) },
              settings.highContrast && styles.panelContrast,
            ]}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { fontSize: scaleFont(26, settings) }]}>Đăng nhập</Text>
            </View>

            {loginError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={palette.rose} />
                <Text style={[styles.errorText, { fontSize: scaleFont(typography.small, settings) }]}>{loginError}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: scaleFont(typography.small, settings) }]}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { minHeight: settings.minTapTarget }, errors.email && styles.inputWrapperError]}>
                    <Ionicons name="mail-outline" size={20} color={palette.muted} />
                    <TextInput
                      style={[styles.input, { fontSize: scaleFont(typography.body, settings) }]}
                      placeholder="nhan.nguyen@example.com"
                      placeholderTextColor={palette.muted}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                )}
              />
              {errors.email ? (
                <Text style={[styles.fieldErrorText, { fontSize: scaleFont(typography.small, settings) }]}>
                  {errors.email.message}
                </Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { fontSize: scaleFont(typography.small, settings) }]}>Mật khẩu</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.inputWrapper, { minHeight: settings.minTapTarget }, errors.password && styles.inputWrapperError]}>
                    <Ionicons name="lock-closed-outline" size={20} color={palette.muted} />
                    <TextInput
                      style={[styles.input, { fontSize: scaleFont(typography.body, settings) }]}
                      placeholder="Nhập mật khẩu"
                      placeholderTextColor={palette.muted}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowPassword((current) => !current)}
                      style={[
                        styles.iconButton,
                        {
                          width: settings.minTapTarget,
                          height: settings.minTapTarget,
                          minHeight: settings.minTapTarget,
                          minWidth: settings.minTapTarget,
                        },
                      ]}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={21}
                        color={palette.primary}
                      />
                    </Pressable>
                  </View>
                )}
              />
              {errors.password ? (
                <Text style={[styles.fieldErrorText, { fontSize: scaleFont(typography.small, settings) }]}>
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={isLoading}
              onPress={handleSubmit(onSubmit)}
              style={({ pressed }) => [
                styles.submitButton,
                { minHeight: settings.minTapTarget },
                isLoading && styles.disabled,
                pressed && styles.pressed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color={palette.white} size="small" />
              ) : (
                <>
                  <Text style={[styles.submitText, { fontSize: scaleFont(typography.body, settings) }]}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={19} color={palette.white} />
                </>
              )}
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  safeAreaContrast: {
    backgroundColor: palette.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xl,
  },
  brandPanel: {
    borderRadius: radius.lg,
    backgroundColor: palette.canvasStrong,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  panelContrast: {
    backgroundColor: palette.white,
    borderColor: palette.primary,
    borderWidth: 2,
  },
  logoMark: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  brandCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: palette.primary,
    fontSize: typography.eyebrow,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  brandName: {
    color: palette.ink,
    fontSize: typography.display,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 40,
  },
  modePanel: {
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    ...shadows.card,
  },
  modeTitle: {
    color: palette.ink,
    fontWeight: '900',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modePill: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    backgroundColor: palette.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  modePillActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  modeText: {
    color: palette.primary,
    fontWeight: '900',
  },
  modeTextActive: {
    color: palette.white,
  },
  subtitle: {
    color: palette.inkSoft,
    fontSize: typography.body,
    fontWeight: '600',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(11, 31, 58, 0.08)',
    gap: spacing.lg,
    ...shadows.lift,
  },
  formHeader: {
    gap: spacing.xs,
  },
  title: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  formHint: {
    color: palette.muted,
    fontSize: typography.small,
    fontWeight: '700',
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.roseSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FFD0CB',
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: palette.rose,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 19,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    color: palette.ink,
    fontSize: typography.small,
    fontWeight: '900',
  },
  inputWrapper: {
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.mutedLight,
    backgroundColor: palette.canvas,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapperError: {
    borderColor: palette.rose,
    backgroundColor: palette.roseSoft,
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: palette.ink,
    fontSize: typography.body,
    fontWeight: '700',
    outlineWidth: 0,
    borderWidth: 0,
    outlineColor: 'transparent',
    borderColor: 'transparent',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldErrorText: {
    color: palette.rose,
    fontSize: 12,
    fontWeight: '800',
  },
  submitButton: {
    minHeight: 58,
    borderRadius: radius.md,
    backgroundColor: palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  submitText: {
    color: palette.white,
    fontSize: typography.body,
    fontWeight: '900',
  },
  demoTip: {
    minHeight: 46,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  demoTipText: {
    flex: 1,
    color: palette.primaryDark,
    fontSize: typography.small,
    fontWeight: '800',
    lineHeight: 18,
  },
  disabled: {
    opacity: 0.62,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
