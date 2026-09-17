import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Row } from '../components/ui';
import { exportAll, getSetting } from '../db';
import { cancelDailyReminder, scheduleDailyReminder, cancelTrialEndReminder } from '../notifications';
import { openManageSubscription, purchaseMode } from '../purchases';
import { removeTrialEndEvent } from '../calendar';
import { useSub } from '../subContext';
import { colors, config, space, type } from '../theme';

export default function SettingsScreen({ navigation }: any) {
  const { active, trialEnd, refresh } = useSub();
  const saved = getSetting('reminder_time');
  const [enabled, setEnabled] = useState(!!saved);
  const [time, setTime] = useState(() => {
    const d = new Date();
    const [h, m] = (saved ?? '6:20').split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  });
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (enabled) scheduleDailyReminder(time.getHours(), time.getMinutes());
  }, [enabled, time]);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    if (!v) await cancelDailyReminder();
  };

  const manage = async () => {
    if (purchaseMode === 'mock') {
      Alert.alert('Cancel subscription (test build)', 'This simulates cancelling. Your data stays on the phone.', [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel subscription', style: 'destructive', onPress: async () => { await openManageSubscription(); await cancelTrialEndReminder(); await removeTrialEndEvent(); await refresh(); } },
      ]);
      return;
    }
    await openManageSubscription();
  };

  const exportJson = async () => {
    const data = exportAll();
    const path = `${FileSystem.cacheDirectory}selah-daily-export-${new Date().toISOString().slice(0, 10)}.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export prayers' });
    else Alert.alert('Saved', path);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={type.h1}>Settings</Text>

      <Text style={styles.section}>SUBSCRIPTION</Text>
      <Pressable onPress={manage}>
        <Row>
          <View>
            <Text style={type.body}>Manage or cancel subscription</Text>
            <Text style={type.small}>
              {active ? (trialEnd ? `Trial ends ${trialEnd.toLocaleDateString()}` : 'Active') : 'Not subscribed'} · opens {Platform.OS === 'android' ? 'Google Play' : 'the App Store'}
            </Text>
          </View>
          <Text style={styles.chev}>↗</Text>
        </Row>
      </Pressable>
      {!active && (
        <Pressable onPress={() => navigation.navigate('Paywall')}>
          <Row>
            <Text style={type.body}>Unlimited requests · {config.priceLabel}</Text>
            <Text style={styles.chev}>›</Text>
          </Row>
        </Pressable>
      )}

      <Text style={styles.section}>REMINDER</Text>
      <Row>
        <Text style={type.body}>Daily reminder</Text>
        <Switch value={enabled} onValueChange={toggle} trackColor={{ true: colors.navy }} />
      </Row>
      <Pressable onPress={() => setShowPicker(true)} disabled={!enabled}>
        <Row>
          <Text style={[type.body, !enabled && { color: colors.muted }]}>Time</Text>
          <Text style={type.body}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Row>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            setShowPicker(Platform.OS === 'ios');
            if (d) setTime(d);
          }}
        />
      )}

      <Text style={styles.section}>YOUR DATA</Text>
      <Pressable onPress={exportJson}>
        <Row>
          <View>
            <Text style={type.body}>Export prayers (JSON)</Text>
            <Text style={type.small}>Share sheet · keep it anywhere you like</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Row>
      </Pressable>
      <Row>
        <View style={{ flex: 1 }}>
          <Text style={type.body}>Privacy</Text>
          <Text style={type.small}>No account. No analytics. Nothing leaves this phone unless you export it.</Text>
        </View>
      </Row>

      <Text style={styles.section}>ABOUT</Text>
      <Row>
        <View style={{ flex: 1 }}>
          <Text style={type.body}>Non-denominational</Text>
          <Text style={type.small}>Scripture: Berean Standard Bible (public domain). No political content.</Text>
        </View>
      </Row>
      <Pressable onPress={() => Linking.openURL(`mailto:${config.supportEmail}`)}>
        <Row>
          <Text style={type.body}>Contact support</Text>
          <Text style={styles.chev}>↗</Text>
        </Row>
      </Pressable>
      <Text style={[type.small, { marginTop: space.md }]}>Selah Daily v1.0 · {purchaseMode === 'mock' ? 'test build' : 'store build'}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, backgroundColor: colors.bg, flexGrow: 1 },
  section: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.muted, marginTop: space.lg, marginBottom: space.xs },
  chev: { color: colors.muted, fontSize: 18 },
});
