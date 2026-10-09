import type { TodayResponse } from '@tula/shared';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planNotifications } from './plan-notifications';
import type { ReminderPrefs } from './prefs-store';

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces today's scheduled reminders; local only, no push server. */
export async function syncNotifications(today: TodayResponse, prefs: ReminderPrefs): Promise<void> {
  if (!supported || !(await Notifications.getPermissionsAsync()).granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const notification of planNotifications(today, prefs, new Date())) {
    await Notifications.scheduleNotificationAsync({
      identifier: notification.id,
      content: { title: notification.title, body: notification.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notification.at },
    });
  }
}
