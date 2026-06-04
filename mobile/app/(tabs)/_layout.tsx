import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { palette, radius } from '@/src/theme/pillpal';
import { getAccessibilitySettings, useAccessibilityStore } from '@/src/store/accessibility';

export default function TabLayout() {
  const settings = getAccessibilitySettings(useAccessibilityStore((state) => state.mode));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: {
          fontSize: settings.tabFontSize,
          fontWeight: '800',
          letterSpacing: 0,
          paddingTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: 18,
          height: settings.tabBarHeight,
          paddingTop: settings.highContrast ? 11 : 9,
          paddingBottom: settings.highContrast ? 14 : 12,
          borderRadius: radius.lg,
          borderTopWidth: 0,
          backgroundColor: settings.highContrast ? palette.white : palette.surface,
          shadowColor: palette.ink,
          shadowOpacity: 0.12,
          shadowOffset: { width: 0, height: 10 },
          shadowRadius: 24,
          elevation: 10,
          borderWidth: settings.highContrast ? 2 : 0,
          borderColor: settings.highContrast ? palette.primary : 'transparent',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quét',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'scan' : 'scan-outline'} size={settings.highContrast ? 28 : 25} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={settings.highContrast ? 27 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Gia đình',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={settings.highContrast ? 27 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="personal"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'medkit' : 'medkit-outline'} size={settings.highContrast ? 27 : 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={settings.highContrast ? 27 : 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
