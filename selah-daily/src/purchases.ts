/**
 * Subscription layer. Real mode uses RevenueCat (react-native-purchases).
 * Mock mode (no API key configured, or Expo Go) simulates a 7-day trial locally so the
 * whole flow — trial start, reminders, calendar event, cancel — can be tested before store setup.
 */
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { getSetting, setSetting } from './db';
import { config } from './theme';

export type SubState = {
  mode: 'real' | 'mock';
  active: boolean; // premium features unlocked (trial or paid)
  trialEnd: Date | null;
};

const ENTITLEMENT = 'premium';
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const apiKey = Platform.OS === 'android' ? extra.rcAndroidKey : extra.rcIosKey;
const isExpoGo = Constants.appOwnership === 'expo';
const mode: 'real' | 'mock' = apiKey && !isExpoGo ? 'real' : 'mock';

let Purchases: typeof import('react-native-purchases').default | null = null;

export async function initPurchases() {
  if (mode !== 'real') return;
  Purchases = (await import('react-native-purchases')).default;
  Purchases.configure({ apiKey: apiKey! }); // anonymous app user ID — no account needed
}

export async function getSubState(): Promise<SubState> {
  if (mode === 'mock') {
    const end = getSetting('mock_trial_end');
    const trialEnd = end ? new Date(end) : null;
    const cancelled = getSetting('mock_cancelled') === '1';
    const active = !!trialEnd && !cancelled && trialEnd.getTime() > Date.now();
    return { mode, active, trialEnd };
  }
  const info = await Purchases!.getCustomerInfo();
  const ent = info.entitlements.active[ENTITLEMENT];
  const trialEnd =
    ent && ent.periodType === 'TRIAL' && ent.expirationDate ? new Date(ent.expirationDate) : null;
  return { mode, active: !!ent, trialEnd };
}

/** Starts the 7-day trial (store sheet in real mode). Returns the trial end date if known. */
export async function startTrial(): Promise<{ ok: boolean; trialEnd: Date | null; error?: string }> {
  if (mode === 'mock') {
    const end = new Date(Date.now() + config.trialDays * 86400000);
    setSetting('mock_trial_end', end.toISOString());
    setSetting('mock_cancelled', null);
    return { ok: true, trialEnd: end };
  }
  try {
    const offerings = await Purchases!.getOfferings();
    const pkg = offerings.current?.monthly ?? offerings.current?.availablePackages[0];
    if (!pkg) return { ok: false, trialEnd: null, error: 'No subscription product is configured yet.' };
    const { customerInfo } = await Purchases!.purchasePackage(pkg);
    const ent = customerInfo.entitlements.active[ENTITLEMENT];
    const trialEnd =
      ent && ent.periodType === 'TRIAL' && ent.expirationDate ? new Date(ent.expirationDate) : null;
    return { ok: !!ent, trialEnd };
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, trialEnd: null };
    return { ok: false, trialEnd: null, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restore(): Promise<boolean> {
  if (mode === 'mock') return (await getSubState()).active;
  const info = await Purchases!.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT];
}

/** Opens the store's subscription management page. In mock mode, cancels locally. */
export async function openManageSubscription() {
  if (mode === 'mock') {
    setSetting('mock_cancelled', '1');
    return;
  }
  const url =
    Platform.OS === 'android'
      ? `https://play.google.com/store/account/subscriptions?package=${Constants.expoConfig?.android?.package}`
      : 'https://apps.apple.com/account/subscriptions';
  await Linking.openURL(url);
}

export const purchaseMode = mode;
