import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSetting, setSetting } from './db';
import { config } from './theme';

const DAILY_ID_KEY = 'notif_daily_id';
const TRIAL_ID_KEY = 'notif_trial_id';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 150],
    });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** One daily reminder at hour:minute. Replaces the previous one. */
export async function scheduleDailyReminder(hour: number, minute: number) {
  const ok = await ensurePermission();
  if (!ok) return false;
  const prev = getSetting(DAILY_ID_KEY);
  if (prev) await Notifications.cancelScheduledNotificationAsync(prev).catch(() => {});
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: config.appName,
      body: 'Your five minutes are waiting. One verse, your prayers, worship.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'default',
    },
  });
  setSetting(DAILY_ID_KEY, id);
  setSetting('reminder_time', `${hour}:${minute}`);
  return true;
}

export async function cancelDailyReminder() {
  const prev = getSetting(DAILY_ID_KEY);
  if (prev) await Notifications.cancelScheduledNotificationAsync(prev).catch(() => {});
  setSetting(DAILY_ID_KEY, null);
  setSetting('reminder_time', null);
}

/** Fires 2 days before the trial ends, at 09:00 local time. */
export async function scheduleTrialEndReminder(trialEnd: Date) {
  const ok = await ensurePermission();
  if (!ok) return false;
  const prev = getSetting(TRIAL_ID_KEY);
  if (prev) await Notifications.cancelScheduledNotificationAsync(prev).catch(() => {});
  const fireAt = new Date(trialEnd);
  fireAt.setDate(fireAt.getDate() - 2);
  fireAt.setHours(9, 0, 0, 0);
  if (fireAt.getTime() <= Date.now()) return false;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your free trial ends in 2 days',
      body: `On ${trialEnd.toLocaleDateString()} you'll be charged ${config.priceLabel}. Cancel any time in Settings.`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId: 'default' },
  });
  setSetting(TRIAL_ID_KEY, id);
  return true;
}

export async function cancelTrialEndReminder() {
  const prev = getSetting(TRIAL_ID_KEY);
  if (prev) await Notifications.cancelScheduledNotificationAsync(prev).catch(() => {});
  setSetting(TRIAL_ID_KEY, null);
}
