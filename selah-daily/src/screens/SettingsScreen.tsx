import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Row } from '../components/ui';
import { exportAll, getSetting, memberSince } from '../db';
import { cancelDailyReminder, scheduleDailyReminder, cancelTrialEndReminder } from '../notifications';
import { openManageSubscription, purchaseMode } from '../purchases';
import { removeTrialEndEvent } from '../calendar';
import { useSub } from '../subContext';
import { howItsRun, makerNote } from '../copy';
import { colors, config, radius, space, type } from '../theme';

export default function SettingsScreen({ navigation }: any) {
  const { active, trialEnd, refresh } = useSub();
  const saved = getSetting('reminder_time');
  const since = memberSince();
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
      Alert.alert('Cancel membership (test build)', 'This simulates cancelling. Your data stays on the phone.', [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel membership',
          style: 'destructive',
          onPress: async () => {
            await openManageSubscription();
            await cancelTrialEndReminder();
            await removeTrialEndEvent();
            await refresh();
          },
        },
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

  const memberStatus = active
    ? trialEnd
      ? `Trial ends ${trialEnd.toLocaleDateString()}`
      : since
      ? `Member since ${since.toLocaleDateString()}`
      : 'Active'
    : 'Not a member';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={type.h1}>Settings</Text>

      <Text style={styles.section}>MEMBERSHIP</Text>
      <Pressable onPress={manage}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>Manage or cancel membership</Text>
            <Text style={type.small}>
              {memberStatus} · opens {Platform.OS === 'android' ? 'Google Play' : 'the App Store'}
            </Text>
          </View>
          <Text style={styles.chev}>↗</Text>
        </Row>
      </Pressable>
      {!active && (
        <Pressable onPress={() => navigation.navigate('Paywall')}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={type.body}>Become a member · {config.priceLabel}</Text>
              <Text style={type.small}>Unlimited requests. The free list of {config.freePrayerLimit} stays free.</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Row>
        </Pressable>
      )}
      <Pressable onPress={() => navigation.navigate('HowItsRun')}>
        <Row>
          <View style={{ flex: 1 }}>
            <Text style={type.body}>{howItsRun.title}</Text>
            <Text style={type.small}>No ads, no investors, one person. Where the money goes.</Text>
          </View>
          <Text style={styles.chev}>›</Text>
        </Row>
      </Pressable>

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

      <View style={styles.note}>
        <Text style={styles.noteTitle}>{makerNote.title}</Text>
        <Text style={[type.small, styles.noteBody]}>{makerNote.public}</Text>
        {active && <Text style={[type.small, styles.noteBody, styles.noteMember]}>{makerNote.members}</Text>}
      </View>

      <Text style={[type.small, { marginTop: space.md }]}>
        Selah Daily v1.0 · {purchaseMode === 'mock' ? 'test build' : 'store build'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: space.lg, backgroundColor: colors.bg, flexGrow: 1 },
  section: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: colors.muted, marginTop: space.lg, marginBottom: space.xs },
  chev: { color: colors.muted, fontSize: 18 },
  note: { marginTop: space.lg, backgroundColor: colors.soft, borderRadius: radius.lg, padding: space.md },
  noteTitle: { ...type.h2, marginBottom: space.xs },
  noteBody: { color: colors.ink, lineHeight: 20 },
  noteMember: { marginTop: space.sm, fontStyle: 'italic' },
});
