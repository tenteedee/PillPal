import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuthStore } from '@/src/store/auth';
import { apiFetch } from '@/src/api/client';

const BRAND_BLUE = '#30a3e6';

// Form validation schema matching backend rules
const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không đúng định dạng'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  
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
      // Call backend API /auth/login
      const result = await apiFetch<{
        accessToken: string;
        user: { id: string; email: string };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (result && result.accessToken) {
        // Save session in auth store
        setSession(result.accessToken, result.user);
        
        // Redirect to homepage (index tab)
        router.replace('/(tabs)');
      } else {
        throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header section with brand logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="medical" size={40} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.brandName}>PillPal</Text>
            <Text style={styles.subtitle}>Người bạn đồng hành uống thuốc an toàn</Text>
          </View>

          {/* Form container */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Đăng nhập</Text>

            {/* Error Message */}
            {loginError && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#b42318" />
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputWrapper,
                    errors.email && styles.inputWrapperError
                  ]}>
                    <Ionicons name="mail-outline" size={20} color="#667872" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="nhan.nguyen@example.com"
                      placeholderTextColor="#99a8a3"
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
              {errors.email && (
                <Text style={styles.fieldErrorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[
                    styles.inputWrapper,
                    errors.password && styles.inputWrapperError
                  ]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#667872" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#99a8a3"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#667872"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.fieldErrorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.demoTipContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#315CA8" />
              <Text style={styles.demoTipText}>
                Demo Account: sử dụng email và mật khẩu của bạn để đăng nhập hoặc kiểm tra với BE.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BRAND_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#13231F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#667872',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0B1412',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(19, 35, 31, 0.03)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#13231F',
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE7E3',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(180, 35, 24, 0.1)',
  },
  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344943',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCE6E2',
    borderRadius: 12,
    backgroundColor: '#F7F9FA',
    paddingHorizontal: 14,
    height: 54,
  },
  inputWrapperError: {
    borderColor: '#B42318',
    backgroundColor: '#FFE7E3',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#13231F',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  fieldErrorText: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  button: {
    backgroundColor: BRAND_BLUE,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  demoTipContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6EEFF',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  demoTipText: {
    flex: 1,
    color: '#315CA8',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
