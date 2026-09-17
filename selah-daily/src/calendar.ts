import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { getSetting, setSetting } from './db';
import { config } from './theme';

const EVENT_KEY = 'calendar_trial_event_id';

async function defaultCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    const cal = await Calendar.getDefaultCalendarAsync();
    return cal?.id ?? null;
  }
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = cals.filter((c) => c.allowsModifications);
  const primary = writable.find((c) => (c as any).isPrimary) ?? writable[0];
  return primary?.id ?? null;
}

/**
 * Adds a personal calendar event "Selah Daily trial ends" 2 days before the trial end,
 * with an alarm at the same time. The user can delete it like any event.
 */
export async function addTrialEndEvent(trialEnd: Date): Promise<'added' | 'denied' | 'no_calendar'> {
  const perm = await Calendar.requestCalendarPermissionsAsync();
  if (!perm.granted) return 'denied';
  const calId = await defaultCalendarId();
  if (!calId) return 'no_calendar';

  const prev = getSetting(EVENT_KEY);
  if (prev) await Calendar.deleteEventAsync(prev).catch(() => {});

  const start = new Date(trialEnd);
  start.setDate(start.getDate() - 2);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime() + 15 * 60 * 1000);

  const id = await Calendar.createEventAsync(calId, {
    title: `${config.appName}: free trial ends ${trialEnd.toLocaleDateString()}`,
    notes: `Your 7-day trial ends on ${trialEnd.toLocaleDateString()}. After that: ${config.priceLabel}. To cancel: Selah Daily → Settings → Manage or cancel subscription.`,
    startDate: start,
    endDate: end,
    alarms: [{ relativeOffset: 0 }],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  setSetting(EVENT_KEY, id);
  return 'added';
}

export async function removeTrialEndEvent() {
  const prev = getSetting(EVENT_KEY);
  if (prev) await Calendar.deleteEventAsync(prev).catch(() => {});
  setSetting(EVENT_KEY, null);
}
