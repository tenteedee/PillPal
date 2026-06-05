import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import {
  getNotificationById,
  type NotificationEvent,
  type NotificationEventType,
} from '@/src/api/notification.api';

type PushData = Record<string, unknown>;

function getPushData(response: Notifications.NotificationResponse): PushData {
  return response.notification.request.content.data as PushData;
}

function getStringField(data: PushData, key: string): string | null {
  const value = data[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getNotificationEventId(data: PushData): string | null {
  return (
    getStringField(data, 'notificationEventId') ??
    getStringField(data, 'notificationId') ??
    getStringField(data, 'id')
  );
}

function getEventType(data: PushData): NotificationEventType | null {
  const value = getStringField(data, 'eventType');
  return isNotificationEventType(value) ? value : null;
}

function isNotificationEventType(value: string | null): value is NotificationEventType {
  return (
    value === 'safety_blocked' ||
    value === 'safety_warning' ||
    value === 'intake_confirmed' ||
    value === 'intake_confirmed_after_warning' ||
    value === 'dose_missed' ||
    value === 'medication_reminder' ||
    value === 'scan_unknown_medicine' ||
    value === 'test'
  );
}

function getDetailRoute(notificationId: string): {
  pathname: '/notifications/[id]';
  params: { id: string };
} {
  return {
    pathname: '/notifications/[id]',
    params: { id: notificationId },
  };
}

function routeForNotification(
  notification: NotificationEvent | null,
  dataEventType: NotificationEventType | null,
): '/(tabs)/schedule' | '/(tabs)' | '/(tabs)/settings' | ReturnType<typeof getDetailRoute> {
  const eventType = notification?.eventType ?? dataEventType;

  if (eventType === 'medication_reminder') {
    return '/(tabs)/schedule';
  }

  if (notification) {
    return getDetailRoute(notification.id);
  }

  if (eventType === 'scan_unknown_medicine') {
    return '/(tabs)';
  }

  return '/(tabs)/settings';
}

export function useNotificationRouting(isAuthenticated: boolean): void {
  const router = useRouter();
  const handledResponseIds = useRef(new Set<string>());

  useEffect(() => {
    if (!isAuthenticated) return;

    async function handleResponse(
      response: Notifications.NotificationResponse | null,
    ): Promise<void> {
      if (!response) return;

      const responseId = response.notification.request.identifier;
      if (handledResponseIds.current.has(responseId)) return;
      handledResponseIds.current.add(responseId);

      const data = getPushData(response);
      const notificationEventId = getNotificationEventId(data);
      const dataEventType = getEventType(data);

      let notification: NotificationEvent | null = null;
      if (notificationEventId) {
        try {
          notification = await getNotificationById(notificationEventId);
        } catch (error) {
          console.warn('Unable to load push notification detail:', error);
        }
      }

      router.push(routeForNotification(notification, dataEventType));
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleResponse(response).catch((error) => {
          console.warn('Unable to handle push tap:', error);
        });
      },
    );

    Notifications.getLastNotificationResponseAsync()
      .then(handleResponse)
      .catch((error) => {
        console.warn('Unable to handle last push response:', error);
      });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, router]);
}
