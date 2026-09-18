import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { startTrial, restore, purchaseMode } from '../purchases';
import { scheduleTrialEndReminder } from '../notifications';
import { addTrialEndEvent } from '../calendar';
import { markMemberSince } from '../db';
import { useSub } from '../subContext';
import { paywall } from '../copy';
import { colors, config, radius, space, type } from '../theme';

export default function PaywallScreen({ navigation }: any) {
  const { refresh, active, trialEnd } = useSub();
  const [busy, setBusy] = useState(false);
  const endPreview = new Date(Date.now() + config.trialDays * 86400000);

  const onStart = async () => {
    setBusy(true);
    const res = await startTrial();
    setBusy(false);
    if (!res.ok) {
      if (res.error) Alert.alert('Could not start the trial', res.error);
      return;
    }
    markMemberSince();
    await refresh();
    const end = res.trialEnd ?? endPreview;
    // Trial-end safety net: local notification 2 days before + a calendar event with its own alarm.
    await scheduleTrialEndReminder(end);
    const toThanks = () => navigation.replace('ThankYou');
    Alert.alert(
      'Trial started',
      `It ends on ${end.toLocaleDateString()}. We will remind you 2 days before.\n\nAlso add a reminder to your calendar?`,
      [
        { text: 'No thanks', style: 'cancel', onPress: toThanks },
        {
          text: 'Add to calendar',
          onPress: async () => {
            const r = await addTrialEndEvent(end);
            if (r === 'denied') Alert.alert('Calendar access was not allowed', 'The in-app reminder is still set.');
            toThanks();
          },
        },
      ]
    );
  };

  const onRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) markMemberSince();
    await refresh();
    Alert.alert(
      ok ? 'Restored' : 'Nothing to restore',
      ok ? 'Your membership is active.' : 'No previous purchase was found for this store account.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={type.h1}>{paywall.title}</Text>
      <Text style={styles.lede}>{paywall.body}</Text>

      <View style={styles.priceBox}>
        <Text style={styles.price}>{config.priceLabel}</Text>
        <Text style={type.small}>{config.trialDays}-day free trial · cancel any time</Text>
      </View>

      <View style={styles.pledge}>
        <Text style={styles.pledgeText}>
          Trial ends <Text style={{ fontWeight: '800' }}>{endPreview.toLocaleDateString()}</Text>. We remind you 2 days
          before, and you can add it to your calendar. Cancel in Settings → Membership. No questions asked.
        </Text>
      </View>

      {active ? (
        <Text style={[type.body, { textAlign: 'center' }]}>
          You're a member{trialEnd ? ` (trial until ${trialEnd.toLocaleDateString()})` : ''}. Thank you.
        </Text>
      ) : (
        <>
          <Button title={paywall.cta} onPress={onStart} variant="amber" disabled={busy} />
          <Text style={[type.small, { textAlign: 'center' }]}>{paywall.fine}</Text>
        </>
      )}
      <Button title="Not now" onPress={() => navigation.goBack()} variant="ghost" />
      <Button title="Restore purchase" onPress={onRestore} variant="ghost" disabled={busy} />

      <Text style={styles.legal}>
        Payment is charged to your store account at the end of the trial. The membership renews monthly at{' '}
        {config.priceLabel} unless cancelled at least 24 hours before the period ends. Manage or cancel in your store
        account settings.
        {'\n'}Terms: {config.termsUrl} · Privacy: {config.privacyUrl}
        {purchaseMode === 'mock' ? '\n\n[Test build: purchases are simulated locally.]' : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, gap: space.md, backgroundColor: colors.bg, flexGrow: 1 },
  lede: { ...type.body, color: colors.muted },
  priceBox: { borderWidth: 2, borderColor: colors.navy, borderRadius: radius.lg, padding: space.lg, alignItems: 'center', gap: 4 },
  price: { fontSize: 32, fontWeight: '800', color: colors.navy },
  pledge: { borderLeftWidth: 3, borderLeftColor: colors.amber, paddingLeft: space.sm },
  pledgeText: { ...type.small, color: colors.ink },
  legal: { ...type.small, fontSize: 11, marginTop: space.md },
});
